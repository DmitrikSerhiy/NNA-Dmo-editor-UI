import { ShortDmoDto } from './../models';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorHub } from './services/editor-hub.service';
import { Component, OnInit, OnDestroy, ElementRef, QueryList, ChangeDetectorRef, ChangeDetectionStrategy, AfterViewInit, ViewChild } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { BeatGeneratorService } from './helpers/beat-generator';
import { BeatsToSwapDto, CreateBeatDto, NnaBeatDto, NnaBeatTimeDto, NnaCharacterInterpolatorPostfix, NnaCharacterInterpolatorPrefix, NnaCharacterTagName, NnaDmoDto, NnaMovieCharacterInBeatDto, RemoveBeatDto, UpdateBeatType } from './models/dmo-dtos';
import { DmoEditorPopupComponent } from '../dmo-editor-popup/dmo-editor-popup.component';
import { CharactersPopupComponent } from './components/characters-popup/characters-popup.component';
import { NnaTooltipService } from 'src/app/shared/services/nna-tooltip.service';

@Component({
	selector: 'app-dmo-editor',
	templateUrl: './dmo-editor.component.html',
	styleUrls: ['./dmo-editor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DmoEditorComponent implements OnInit, AfterViewInit, OnDestroy {

	connectionState: string;
	autosaveTitle: string;
	connectionStateTitle: string;

	private savingIsDoneTitle: string = "Your progress is auto-saved";
	private savingInProgressTitle: string = "Auto-saving";
	private autoSaveIsPending: string = "Auto-save is pending";
	private autoSavingIsNotWorking: string = "Your progress will not be auto-saved";

	private connectionEstablishedTitle: string = "Connection established";
	private connectionReconnectionTitle: string = "Reconnecting";
	private connectionDisconnectedTitle: string = "Connection lost";

	// initial fields
	isDmoInfoSet: boolean = false;
	beatsLoading: boolean = true;
	dmoId: string;
	currentShortDmo: ShortDmoDto;
	initialDmoDto: NnaDmoDto;
	beatWasSet: boolean = false;
	showControlPanel: boolean = false;
	editorIsConnected: boolean;
	editorIsReconnecting: boolean;
	beatsUpdating: boolean = false;
	connectionStateTooltipIsShown: boolean = false
	connectionStateIconTooltipIsShown: boolean = false

	// events
	updateGraphEvent: EventEmitter<any> = new EventEmitter<any>();
	updateBeatsEvent: EventEmitter<any> = new EventEmitter<any>();
	updateCharactersEvent: EventEmitter<any> = new EventEmitter<any>();
	focusElementEvent: EventEmitter<any> = new EventEmitter<any>();
	openBeatTypeTooltipEvent: EventEmitter<any> = new EventEmitter<any>();
	focusElementInBeatsFlowEvent: EventEmitter<any> = new EventEmitter<any>();

	// ------ [start] not state
	private isDmoFinised: boolean;
	private beatsMetaData: any[] = [];
	private beatsIds: string[] = [];
	private plotPointsWithMetaData: any[] = [];

	private plotPointElements: QueryList<ElementRef>;   // elements
	private beatElements: QueryList<ElementRef>;        // elements
	private timePickerElements: QueryList<ElementRef>;  // elements
   // ------ [end] not state

   @ViewChild('connectionStateElm') connectionStateElement: ElementRef;
   @ViewChild('connectionStateTooltip') connectionStateTooltipElement: ElementRef;
   @ViewChild('connectionStateTooltipArrow') connectionStateTooltipArrowElement: ElementRef;

   @ViewChild('connectionStateIconElm') connectionStateIconElmElement: ElementRef;
   @ViewChild('connectionStateIconTooltip') connectionStateIconTooltipElement: ElementRef;
   @ViewChild('connectionStateIconTooltipArrow') connectionStateIconTooltipArrowElement: ElementRef;

	constructor(
		private editorHub: EditorHub,
		private activatedRoute: ActivatedRoute,
		private router: Router,
		public matModule: MatDialog,
		private cdRef: ChangeDetectorRef,
		private dataGenerator: BeatGeneratorService,
		private nnaTooltipService: NnaTooltipService
		) { }

	async ngOnInit(): Promise<void> {
		this.activatedRoute.queryParams.subscribe((params) => {
			this.dmoId = params['dmoId'];
			this.cdRef.detectChanges();
		});

		window.onbeforeunload = () => this.closeEditorAndClearData(); // todo: look at every compenent onDestroy method. add this when there's must have logic in onDestroy method
	}

	async ngAfterViewInit(): Promise<void> {
		await this.prepareEditor();
		this.cdRef.detectChanges();
		await this.loadDmo();
		this.cdRef.detectChanges();
		this.subscribeToClipboard();
		this.cdRef.detectChanges();
		this.isDmoInfoSet = true;
		this.showControlPanel = true;
		this.cdRef.detectChanges();
	}

	async prepareEditor(): Promise<void> {
		await this.editorHub.startConnection();
		this.setConnectionView();
		this.editorHub.onConnectionChanged.subscribe(() => this.setConnectionView(true));
	}

	async tryReconnect(): Promise<void> {
		await this.editorHub.startConnection();
		this.setConnectionView(true);
		await this.reloadDmo();
		this.cdRef.detectChanges();
		this.isDmoInfoSet = true;
		this.showControlPanel = true;
		this.cdRef.detectChanges();
		console.clear()
		// todo: what if user have some unsaved work here??? offer to swith to offline mode here or mark not saved changes.
	}

	async syncBeats($event: any): Promise<void> {
		this.autosaveTitle = this.savingInProgressTitle;
		this.beatsUpdating = true;
		if ($event.source == 'add') {
			await this.editorHub.addBeat($event.metaData);
		} else if ($event.source == 'remove') {
			await this.editorHub.removeBeat($event.metaData);
		} else if (
			$event.source == 'beat_data_holder_focus_out' || 
			$event.source == 'time_picker_focus_out' || 
			$event.source == 'change_beat_type' || 
			$event.source == 'attach_character_to_beat' ||
			$event.source == 'detach_character_from_beat') {
			await this.editorHub.updateBeat(this.selectSingleBeatForServer($event.metaData));
		} else if ($event.source == 'swap') {
			await this.editorHub.swapBeats($event.metaData);
		}
		this.autosaveTitle = this.savingIsDoneTitle;
		this.beatsUpdating = false;
		this.cdRef.detectChanges();

		// let build = this.buildDmoWithBeatsJson();
		// await this.editorHub.updateDmosJson(build);

		console.log(`beats was synced. Source: ${$event.source}`);
	}

	async ngOnDestroy(): Promise<void> {
		await this.closeEditorAndClearData();
	}

	async reloadDmo(): Promise<void> {
		this.autosaveTitle = this.savingInProgressTitle;
		this.cdRef.detectChanges();
		this.clearBeatsAndCharacters();
		this.clearDmo();

		setTimeout(async () => {
			await this.loadDmo();
			this.autosaveTitle = this.savingIsDoneTitle;
			this.cdRef.detectChanges();
		}, 800);
	}

	async reloadBeatsAndCharacters(): Promise<void> {
		this.autosaveTitle = this.savingInProgressTitle;
		this.cdRef.detectChanges();
		this.clearBeatsAndCharacters();
		await this.editorHub.sanitizeTempIds(this.dmoId);

		setTimeout(async () => {
			await this.loadDmoBeatsAndCharacters(false);
			this.cdRef.detectChanges();
			this.autosaveTitle = this.savingIsDoneTitle;
			this.cdRef.detectChanges();
		}, 800);
	}

	// #region general settings

	async editCurrentDmo(): Promise<void> {
		if (!this.editorHub.isConnected) {
			return;
		}
		this.nnaTooltipService.hideAllTooltips();
		const popupResult = await this.finalizeInitialPopup();
		if (!popupResult) {
			return;
		}
		await this.editorHub.updateShortDmo(popupResult);
		this.initDmo(popupResult);
		this.cdRef.detectChanges();
	}

	async closeEditor(): Promise<void> {
		this.router.navigate(['app/dmos']);
	}

	private subscribeToClipboard() {
		document.addEventListener('paste', this.pasteSanitizer);
	}

	private pasteSanitizer($event: any): void {
		if ($event.target.nodeName != "DIV" || !$event.target.className.includes("beat-data-holder")) {
			return;
		}
		$event.preventDefault();
		const paste = $event.clipboardData.getData('text');
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		selection.deleteFromDocument();
		selection.getRangeAt(0).insertNode(document.createTextNode(paste));
	}

	private unsubscribeFromClipboard() {
		document.removeEventListener('paste', this.pasteSanitizer);
	}

	private async finalizeInitialPopup(): Promise<ShortDmoDto> {
		let popupData = null;
		if (this.currentShortDmo) {
			popupData = this.currentShortDmo;
		}
	 
		const popupResult = await this.matModule
			.open(DmoEditorPopupComponent, { data: popupData, width: '400px' })
			.afterClosed()
			.toPromise();

		if (!popupResult || popupResult.cancelled) {
			this.matModule.ngOnDestroy();
			return null;
		} 

		let newDmoDetails = { name: popupResult.name, movieTitle: popupResult.movieTitle } as ShortDmoDto;
		newDmoDetails.shortComment = popupResult.shortComment;
		newDmoDetails.dmoStatus = +popupResult.dmoStatus;
		if (this.currentShortDmo && this.currentShortDmo.id) {
			newDmoDetails.id = this.currentShortDmo.id;
		}

		this.matModule.ngOnDestroy();
		return newDmoDetails;
	}


	private initDmo(result: ShortDmoDto): void {
		if (!result) {
			return;
		}
		if (!this.currentShortDmo) {
			this.currentShortDmo = { name: result.name, movieTitle: result.movieTitle } as ShortDmoDto;
		} else {
			this.currentShortDmo.movieTitle = result.movieTitle;
			this.currentShortDmo.name = result.name;
		}

		if (result.id) {
			this.currentShortDmo.id = result.id;
			this.dmoId = result.id;
		}
		this.currentShortDmo.shortComment = result.shortComment;
		if (result.hasBeats !== undefined && result.hasBeats !== null) {
			this.currentShortDmo.hasBeats = result.hasBeats;
		}

		if (result.dmoStatus !== undefined && result.dmoStatus !== null) {
			this.isDmoFinised = result.dmoStatus === 1;

			if (this.currentShortDmo.dmoStatus !== undefined) {
				if (this.currentShortDmo.dmoStatus != result.dmoStatus) {
					this.updateGraphEvent.emit({isFinished: this.isDmoFinised});
				}
			}

			this.currentShortDmo.dmoStatus = result.dmoStatus;
		}

		this.initialDmoDto = new NnaDmoDto();
		this.initialDmoDto.dmoId = this.dmoId;
		this.initialDmoDto.beats = [];
		this.initialDmoDto.characters = [];
	}

	private async loadDmo() {
		const shortDmo = await this.editorHub.loadShortDmo(this.dmoId);
		if (!shortDmo) {
			return;
		}

		this.initDmo(shortDmo);
		this.cdRef.detectChanges();
		await this.loadDmoBeatsAndCharacters(true);
		this.cdRef.detectChanges();
	}

	private async loadDmoBeatsAndCharacters(sanitizeBeforeLoad: boolean): Promise<void> {
		const dmoWithData = await this.editorHub.initialDmoLoadWithData(this.dmoId, sanitizeBeforeLoad);
		if (dmoWithData?.beats?.length == 0) {
			this.initialDmoDto.beats.push(this.dataGenerator.createNnaBeatWithDefaultData());
			
			const initialBeat = {
				dmoId: this.dmoId,
				order: 0,
				tempId: this.initialDmoDto.beats[0].beatId,
				type: 1,
				charactersInBeat: []
			} as CreateBeatDto;
	
			await this.editorHub.addBeat(initialBeat);		
		} else {
			this.initialDmoDto.beats = dmoWithData.beats;
		}

		this.initialDmoDto.characters = dmoWithData.characters;
		this.beatsLoading = false;
	}

	private setConnectionView(skipTooltipSetup: boolean = false): void {
		if (this.editorHub.isConnected) {
			this.editorIsConnected = true;
			this.editorIsReconnecting = false;
			this.connectionState = "online";
			this.connectionStateTitle = this.connectionEstablishedTitle;
			this.autosaveTitle = this.savingIsDoneTitle;
		} else if (this.editorHub.isReconnecting) {
			this.editorIsConnected = false;
			this.editorIsReconnecting = true;
			this.connectionState = "connecting";
			this.connectionStateTitle = this.connectionReconnectionTitle;
			this.autosaveTitle = this.autoSaveIsPending;
		} else {
			this.editorIsConnected = false;
			this.editorIsReconnecting = false;
			this.connectionState = "offline";
			this.connectionStateTitle = this.connectionDisconnectedTitle;
			this.autosaveTitle = this.autoSavingIsNotWorking;
		}

		this.cdRef.detectChanges();
		if (skipTooltipSetup == true) {
			return;
		}

		const intervalId = setInterval(() => {
			if (this.isDmoInfoSet == false) {
				return;
			}
			
			if (this.editorHub.isDisconnected) {
				clearInterval(intervalId);
				return;
			}

			this.nnaTooltipService.addTooltip(
				this.nnaTooltipService.connectionStateTooltipName, 
				this.connectionStateElement.nativeElement,
				this.connectionStateTooltipElement.nativeElement,
				{ 
					arrowNativeElenemt: this.connectionStateTooltipArrowElement.nativeElement,
					placement: 'bottom',
					shift: 5
				}
			);

			this.nnaTooltipService.addTooltip(
				this.nnaTooltipService.connectionStateIconTooltipName, 
				this.connectionStateIconElmElement.nativeElement,
				this.connectionStateIconTooltipElement.nativeElement,
				{ 
					arrowNativeElenemt: this.connectionStateIconTooltipArrowElement.nativeElement,
					placement: 'bottom',
					shift: 5
				}
			);

			this.cdRef.detectChanges();
			clearInterval(intervalId);
		}, 1000);

	}

	showConnectionStateTooltip(): void {
		if (this.connectionStateTooltipIsShown == true) {
			return;
		}
		this.nnaTooltipService.showTooltip(this.nnaTooltipService.connectionStateTooltipName);
		this.connectionStateTooltipIsShown = true;
	}

	hideConnectionStateTooltop(): void {
		if (this.connectionStateIconTooltipIsShown == true) {
			this.hideConnectionStateIconTooltop();
		}
		this.connectionStateTooltipIsShown = false;
		setTimeout(() => {
			if (this.connectionStateTooltipIsShown == false) {
				this.nnaTooltipService.hideTooltip(this.nnaTooltipService.connectionStateTooltipName);
			}
		}, 500);
	}

	showConnectionStateIconTooltip(): void {
		if (this.connectionStateIconTooltipIsShown == true) {
			return;
		}
		this.nnaTooltipService.showTooltip(this.nnaTooltipService.connectionStateIconTooltipName);
		this.connectionStateIconTooltipIsShown = true;
	}

	hideConnectionStateIconTooltop(): void {
		if (this.connectionStateTooltipIsShown == true) {
			this.hideConnectionStateTooltop();
		}
		this.connectionStateIconTooltipIsShown = false;
		setTimeout(() => {
			if (this.connectionStateIconTooltipIsShown == false) {
				this.nnaTooltipService.hideTooltip(this.nnaTooltipService.connectionStateIconTooltipName);
			}
		}, 500);
	}
	
  	// #endregion


	// #region characters

	async syncCharactersInDmoFromBeats($event: any): Promise<void> {
		if ($event.operation == 'attach') {
			await this.editorHub.attachCharacterToBeat($event.data.id, this.dmoId, $event.data.beatId, $event.data.characterId);
		} else if ($event.operation == 'detach') {
			await this.editorHub.detachCharacterFromBeat($event.data.id, this.dmoId, $event.data.beatId);
		} else {
			return;
		}

		console.log(`Characters in beats sync: id: ${$event.data.id}. Operation: ${$event.operation}`);
	}

	async openCharactersPopup($event: any = null): Promise<void> {
		if (!this.editorHub.isConnected) {
			return;
		}
		this.nnaTooltipService.hideAllTooltips();
		await this.finalizeCharactersPopup($event);
	}

	
	private async finalizeCharactersPopup(openOnAction: any): Promise<void> {
		const popupResult = await this.matModule
			.open(CharactersPopupComponent, { data: { dmoId: this.dmoId, openOnAction: openOnAction }, width: '400px' })
			.afterClosed()
			.toPromise();

		if (!popupResult || popupResult.hasChanges === false) {
			this.matModule.ngOnDestroy();
			return;
		} 

		if (popupResult.hasChanges === true) {
			this.initialDmoDto.characters = popupResult.changes;
			this.updateCharactersEvent.emit({characters: popupResult.changes, operations: popupResult.operations });
			this.cdRef.detectChanges();
		}

		this.matModule.ngOnDestroy();
	}


	// #endregion


	  
    // #region callbacks from children

	async beatsSet(callbackResult: any): Promise<void> {
		this.beatElements = callbackResult.beats;
		this.timePickerElements = callbackResult.timePickers;
		this.beatsMetaData = callbackResult.beatMetadata
		this.beatsIds = callbackResult.beatsIds;
		this.plotPointsWithMetaData = this.beatElements.map((beatElement, i) => { return {beatId: this.beatsIds[i], beatType: beatElement.nativeElement.dataset.beatType, plotPointMetaData: this.beatsMetaData[i], order: i} }); 

		this.beatWasSet = true;
		this.cdRef.detectChanges();

		if (callbackResult.lastAction != null) {
			await this.syncBeats({source: callbackResult.lastAction, metaData: callbackResult.lastActionMetaData});
		}
	}

	async reorderBeats(beatsToSwap: BeatsToSwapDto): Promise<void>  {
		let beats = this.selectBeatDtos();
		beats.forEach(beat => {
			if (beat.beatId == beatsToSwap.beatToMove.id) {
				beat.order = beatsToSwap.beatToReplace.order;
			}

			if (beat.beatId == beatsToSwap.beatToReplace.id) {
				beat.order = beatsToSwap.beatToMove.order;
			} 
		});

		const sortedBeats = beats.sort((a, b) => Number(a.order) - Number(b.order));
		beatsToSwap.dmoId = this.dmoId;

		this.updateBeatsEvent.emit({ beats: sortedBeats, isFinished: this.isDmoFinised, actionName: 'swap', actionMetaData: beatsToSwap });
		this.updatePlotPoints();
	}

	plotPointsSet(callbackResult: any): void {
		this.plotPointElements = callbackResult.elements;
		this.cdRef.detectChanges();
	}

	openBeatTypeTooltip($event: any): void {
		this.openBeatTypeTooltipEvent.emit($event);
	}

	focusElementInBeatsFlow($event: any): void {
		this.focusElementEvent.emit($event);
	}

	async updateBeatType(updateBeatTypeResult: UpdateBeatType): Promise<void> {
		let beats = this.selectBeatDtos();
		let beatIndexToChangeType;
		beats.forEach((b, i) =>  {
			if (b.beatId == updateBeatTypeResult.beatId) {
				b.type = updateBeatTypeResult.newType;
				beatIndexToChangeType = i;
				return;
			} 
		});

		this.updateBeatsEvent.emit({ beats: beats, isFinished: this.isDmoFinised, actionName: 'change_beat_type', actionMetaData: beatIndexToChangeType });
		this.updatePlotPoints();
	}

	// #endregion


	// #region CRUD
  
	finishDmo(): void {
		this.isDmoFinised = !this.isDmoFinised;
		this.updatePlotPoints();
	}

	lineCountChanged(change: any): void {
		this.beatsIds.forEach((beatId, i) => {
			if (beatId == change.beatId) {
				this.beatsMetaData[i] = { lineCount: change.newLineCount.lineCount, lines: change.newLineCount.lines };
				return;
			}
		});

		this.updatePlotPoints();
	}

  	addBeat(fromBeat: any): void {
		let indexToInsert: number;
		this.beatsIds.forEach((beatId, i) => {
			if (beatId == fromBeat.beatIdFrom) {
				indexToInsert = i;
				return;
			}
		});

		let beats = this.selectBeatDtos();
		const newBeat = this.dataGenerator.createNnaBeatWithDefaultData();
		beats.splice(indexToInsert + 1, 0 , newBeat);
		beats = this.orderBeats(beats);
		const newBeatDto = this.dataGenerator.getCreatedBeatDto(newBeat, this.dmoId);
		this.updateBeatsEvent.emit({ beats: beats, isFinished: this.isDmoFinised, timePickerToFocus: newBeat.beatId, actionName: 'add', actionMetaData: newBeatDto});
		this.updatePlotPoints();
  	}

	removeBeat(fromBeat: any): void {
		let indexToRemove: number;
		this.beatsIds.forEach((beatId, i) => {
			if (beatId == fromBeat.beatIdToRemove) {
				indexToRemove = i;
				return;
			}
		});

		let beats = this.selectBeatDtos();
		beats.splice(indexToRemove, 1);
		beats = this.orderBeats(beats);

		const beatIdToFocus = indexToRemove == 0 ? 0 : indexToRemove - 1;
		const beatDtoToRemove = {
			id: fromBeat.beatIdToRemove,
			dmoId: this.dmoId,
			order: indexToRemove
		} as RemoveBeatDto;

		this.updateBeatsEvent.emit({ beats: beats, isFinished: this.isDmoFinised, beatIdToFocus: this.beatsIds[beatIdToFocus], actionName: 'remove', actionMetaData: beatDtoToRemove});
		this.updatePlotPoints();
	}

	private updatePlotPoints(): void {
		let newPlotPoints = []
		this.plotPointsWithMetaData.forEach((plotPointWithMetaData, i) => {
			newPlotPoints.push({beatId: plotPointWithMetaData.beatId, beatType: plotPointWithMetaData.beatType, plotPointMetaData: this.beatsMetaData[i], order: i});
		});

		this.updateGraphEvent.emit({newplotPoints: newPlotPoints, isFinished: this.isDmoFinised});
	}

  	// #endregion


	// #region helpers

	private orderBeats(beats: NnaBeatDto[]): NnaBeatDto[] {
		let shouldIncrement: boolean = false;
		beats.forEach((beat, i) => {
			if (beat.order == -1) {
				beat.order = i - 1;
				shouldIncrement = true;
			} else {
				beat.order = i;
			}
			if (shouldIncrement) {
				beat.order = beat.order + 1;
			}
		});

		return beats;
	} 

	private buildTimeDtoFromBeat(beatId: string): NnaBeatTimeDto {
		let selectedTimePickerElement: any;
		this.timePickerElements.forEach(timePicker => {
			if (this.selectBeatIdFromTimePicker(timePicker.nativeElement) == beatId) {
				selectedTimePickerElement = timePicker.nativeElement;
				return;
			}
		});
		
		return this.convertTimeToDto(selectedTimePickerElement.value);
	}

	private selectBeatIdFromBeatDataHolder(nativeElement: any): string {
		let beatSufix = 'beat_';
		return nativeElement.getAttribute('id').substring(beatSufix.length);
	}

	private selectBeatIdFromTimePicker(nativeElement: any): string {
		let beatSufix = 'time_picker_';
		return nativeElement.getAttribute('id').substring(beatSufix.length);
	}
  
	private convertTimeToDto(value: string): NnaBeatTimeDto {
		let time = value.replace(/:+/g, '');
		time = time.replace(/ +/g, '0');
		
		var timeDto = new NnaBeatTimeDto();
		timeDto.hours = 0;
		timeDto.minutes = 0;
		timeDto.seconds = 0;

		if (time.length == 1) {
			timeDto.hours = +time[0];
			return timeDto;
		} else if (time.length > 1 && time.length <= 3) {
			timeDto.hours = +time[0];
		if (time.length == 2) {
			timeDto.minutes = +time[1];
		} else {
			timeDto.minutes = +`${time[1]}${time[2]}`;
		}
			return timeDto;
		}

		timeDto.hours = +time[0];
		timeDto.minutes = +`${time[1]}${time[2]}`;
		if (time.length == 4) {
			timeDto.seconds = +time[3];
		} else {
			timeDto.seconds = +`${time[3]}${time[4]}`;
		}
		return timeDto;
	}

	private selectBeatDtos(): NnaBeatDto[] {
		return this.beatElements.map((beatElement, i) => {
				return this.selectSingleBeatForClient(beatElement.nativeElement, i);
		});
	}

	private selectSingleBeatForClient(beatElement: HTMLElement, index): NnaBeatDto  {
		const beatId = this.selectBeatIdFromBeatDataHolder(beatElement);
		const beat: NnaBeatDto = {
			beatId: beatId,
			order: index,
			text: encodeURIComponent(beatElement.innerHTML),
			time: this.buildTimeDtoFromBeat(beatId),
			type: +beatElement.dataset.beatType,
			charactersInBeat: this.selectCharactersFromBeatElement(beatElement)
		}

		return beat;
	}


	private selectSingleBeatForServer(index: number): NnaBeatDto {
		const beatElement = this.beatElements.toArray()[index].nativeElement;
		const beatId = this.selectBeatIdFromBeatDataHolder(beatElement);
		const beat : NnaBeatDto = {
			beatId: beatId,
			order: index,
			text: encodeURIComponent(this.getBeatTextWithInterpolatedCharacterTags(beatElement)),
			time: this.buildTimeDtoFromBeat(beatId),
			type: beatElement.dataset.beatType,
			charactersInBeat: this.selectCharactersFromBeatElement(beatElement)
		}

		return beat;
	}

	private selectCharactersFromBeatElement(beatElement: any): NnaMovieCharacterInBeatDto[] {
		let characters: NnaMovieCharacterInBeatDto[] = [];
		(beatElement as HTMLElement).childNodes?.forEach((childNode: HTMLElement) => {
			if (childNode.nodeName.toLowerCase() == NnaCharacterTagName.toLowerCase()) {
				characters.push({
					id: childNode.dataset.id, 
					characterId: childNode.dataset.characterId, 
					name: childNode.nodeValue, 
					color: childNode.style.borderBottomColor 
				} as NnaMovieCharacterInBeatDto )
			}
		});
		return characters;
	}

	private getBeatTextWithInterpolatedCharacterTags(beatElement: HTMLElement): string {
		let beatCopy = beatElement.cloneNode(true) as HTMLElement;
		beatCopy.childNodes?.forEach((childNode: HTMLElement) => {
			if (childNode.nodeName.toLowerCase() == NnaCharacterTagName.toLowerCase()) {
				const characterInBeatId = childNode.dataset.id;
				const interpolatedCharacterTag = document.createTextNode(NnaCharacterInterpolatorPrefix + characterInBeatId + NnaCharacterInterpolatorPostfix);
				childNode.parentElement.insertBefore(interpolatedCharacterTag, childNode);
				childNode.remove();
			}
		});

		return beatCopy.innerHTML;
	}

	// private buildDmoWithBeatsJson() : NnaDmoWithBeatsAsJson {
	// 	let dmoWithJson : NnaDmoWithBeatsAsJson = new NnaDmoWithBeatsAsJson(); 
	// 	dmoWithJson.json = JSON.stringify(this.selectBeatDtos());
	// 	dmoWithJson.dmoId = this.dmoId;
	// 	return dmoWithJson;
	// }

	private clearBeatsAndCharacters(): void {
		this.beatWasSet = false;
		this.beatsLoading = true;
		this.beatsUpdating = false;
		this.initialDmoDto.beats = [];
		this.initialDmoDto.characters = [];
		this.cdRef.detectChanges();
	}

	private clearDmo() : void {
		this.matModule.closeAll();
		this.isDmoInfoSet = false;
		this.showControlPanel = false;
		this.cdRef.detectChanges();
	}

	private async closeEditorAndClearData(): Promise<void> {
		await this.editorHub.abortConnection();
		this.unsubscribeFromClipboard();
		this.dmoId = '';
		this.showControlPanel = false;
		this.currentShortDmo = null;
		
		this.clearBeatsAndCharacters();
		this.clearDmo();
		this.editorIsConnected = false;
		this.editorIsReconnecting = false;

		this.updateGraphEvent = null;
		this.updateBeatsEvent = null;
		this.updateCharactersEvent = null;
		this.focusElementEvent = null;
		this.openBeatTypeTooltipEvent = null;
		this.focusElementInBeatsFlowEvent = null;

		this.connectionState = null;
		this.autosaveTitle = '';
		this.connectionStateTitle = '';

		this.cdRef.detectChanges();
	}

  	// #endregion
}
