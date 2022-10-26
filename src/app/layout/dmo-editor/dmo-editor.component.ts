import { ShortDmoDto } from './../models';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorHub } from './services/editor-hub.service';
import { Component, OnInit, OnDestroy, ElementRef, QueryList, ChangeDetectorRef, ChangeDetectionStrategy, AfterViewInit, ViewChild } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { BeatGeneratorService } from './helpers/beat-generator';
import { BeatsToSwapDto, CreateBeatDto, NnaBeatDto, NnaBeatTimeDto, NnaDmoDto, RemoveBeatDto, UpdateBeatType } from './models/dmo-dtos';
import { DmoEditorPopupComponent } from '../dmo-editor-popup/dmo-editor-popup.component';
import { CharactersPopupComponent } from './components/characters-popup/characters-popup.component';
import { NnaTooltipService } from 'src/app/shared/services/nna-tooltip.service';
import { arrow, computePosition, shift } from '@floating-ui/dom';

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
	private savingInProgressTitle: string = "Your progress is saving";
	private autoSavingIsNotWorking: string = "Your progress won't be auto-saved";
	
	// initial fields
	isDmoInfoSet: boolean = false;
	beatsLoading: boolean = true;
	dmoId: string;
	currentShortDmo: ShortDmoDto;
	initialDmoDto: NnaDmoDto;
	beatWasSet: boolean = false;
	editorIsConnected: boolean;
	editorIsReconnecting: boolean;
	beatsUpdating: boolean = false;
	connectionStateTooltipIsShown: boolean = false
	connectionStateIconTooltipIsShown: boolean = false

	// events
	updateGraphEvent: EventEmitter<any> = new EventEmitter<any>();
	updateBeatsEvent: EventEmitter<any> = new EventEmitter<any>();
	focusElementEvent: EventEmitter<any> = new EventEmitter<any>();
	openBeatTypeTooltipEvent: EventEmitter<any> = new EventEmitter<any>();
	closeBeatTypeTooltipEvent: EventEmitter<any> = new EventEmitter<any>();
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
	}

	async ngAfterViewInit(): Promise<void> {
		await this.loadDmo()
		this.subscribeToClipboard();

		this.nnaTooltipService.addTooltip(
			'connectionState', 
			this.connectionStateElement,
			this.connectionStateTooltipElement,
			{ 
				arrowElenemt: this.connectionStateTooltipArrowElement,
				placement: 'bottom',
				shift: 5
			}
		);

		this.nnaTooltipService.addTooltip(
			'connectionStateIcon', 
			this.connectionStateIconElmElement,
			this.connectionStateIconTooltipElement,
			{ 
				arrowElenemt: this.connectionStateIconTooltipArrowElement,
				placement: 'bottom',
				shift: 5
			}
		);
	}

	async prepareEditor(): Promise<void> {
		await this.editorHub.startConnection();
		this.setConnectionView();
		this.editorHub.onConnectionChanged.subscribe(() => this.setConnectionView());
	}


	async tryReconnect(): Promise<void> {
		await this.editorHub.startConnection();
		this.setConnectionView();
		this.editorHub.onConnectionChanged.subscribe(() => this.setConnectionView());
		await this.loadDmoWithBeats();
		this.cdRef.detectChanges();
		
		// todo: what if user have some unsaved work here??? offer to swith to offline mode here.
	}

	async syncBeats($event: any): Promise<void> {
		this.autosaveTitle = this.savingInProgressTitle;
		this.beatsUpdating = true;
		if ($event.source == 'add') {
			await this.editorHub.addBeat($event.metaData);
		} else if ($event.source == 'remove') {
			await this.editorHub.removeBeat($event.metaData);
		} else if ($event.source == 'beat_data_holder_focus_out' || $event.source == 'time_picker_focus_out' || $event.source == 'change_beat_type') {
			await this.editorHub.updateBeat(this.selectSingleBeat($event.metaData));
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


	// #region general settings

	async editCurrentDmo(): Promise<void> {
		const popupResult = await this.finalizeInitialPopup();
		if (!popupResult) {
			return;
		}
		await this.editorHub.updateShortDmo(popupResult);
		this.initDmo(popupResult);
		this.cdRef.detectChanges();
	}

	async loadDmo() {
		await this.prepareEditor();
		await this.loadDmoWithBeats();
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

		this.isDmoInfoSet = true;
	}

	private async loadDmoWithBeats() {
		const shortDmo = await this.editorHub.loadShortDmo(this.dmoId);
		if (!shortDmo) {
			return;
		}

		this.initDmo(shortDmo);
		this.cdRef.detectChanges();
		await this.loadDmoWithData();
		this.cdRef.detectChanges();
	}

	private async loadDmoWithData(): Promise<void> {
		const dmoWithData = await this.editorHub.initialDmoLoadWithData(this.dmoId);
		if (dmoWithData?.beats?.length == 0) {
			this.initialDmoDto.beats.push(this.dataGenerator.createNnaBeatWithDefaultData());
			
			const initialBeat = {
				dmoId: this.dmoId,
				order: 0,
				tempId: this.initialDmoDto.beats[0].beatId,
				type: 1
			} as CreateBeatDto;
	
			await this.editorHub.addBeat(initialBeat);		
		} else {
			this.initialDmoDto.beats = dmoWithData.beats;
		}

		this.initialDmoDto.characters = dmoWithData.characters;
		this.beatsLoading = false;
	}

	private setConnectionView(): void {
		if (this.editorHub.isConnected) {
			this.editorIsConnected = true;
			this.editorIsReconnecting = false;
			this.connectionState = "online";
			this.connectionStateTitle = "Connection is established";
			this.autosaveTitle = this.savingIsDoneTitle;
		} else if (this.editorHub.isReconnecting) {
			this.editorIsConnected = false;
			this.editorIsReconnecting = true;
			this.connectionState = "connecting";
			this.connectionStateTitle = "Editor is reconnecting";
			this.autosaveTitle = this.autoSavingIsNotWorking;
		} else {
			this.editorIsConnected = false;
			this.editorIsReconnecting = false;
			this.connectionState = "offline";
			this.connectionStateTitle = "Editor was disconnected";
			this.autosaveTitle = this.autoSavingIsNotWorking;
		}
		this.cdRef.detectChanges();
	}

	showConnectionStateTooltip(): void {
		if (this.connectionStateTooltipIsShown == true) {
			return;
		}
		this.nnaTooltipService.showTooltip('connectionState');
		this.connectionStateTooltipIsShown = true;
	}

	hideConnectionStateTooltop(): void {
		if (this.connectionStateIconTooltipIsShown == true) {
			this.hideConnectionStateIconTooltop();
		}
		this.connectionStateTooltipIsShown = false;
		setTimeout(() => {
			if (this.connectionStateTooltipIsShown == false) {
				this.nnaTooltipService.hideTooltip('connectionState');
			}
		}, 500);
	}

	showConnectionStateIconTooltip(): void {
		if (this.connectionStateIconTooltipIsShown == true) {
			return;
		}
		this.nnaTooltipService.showTooltip('connectionStateIcon');
		this.connectionStateIconTooltipIsShown = true;
	}

	hideConnectionStateIconTooltop(): void {
		if (this.connectionStateTooltipIsShown == true) {
			this.hideConnectionStateTooltop();
		}
		this.connectionStateIconTooltipIsShown = false;
		setTimeout(() => {
			if (this.connectionStateIconTooltipIsShown == false) {
				this.nnaTooltipService.hideTooltip('connectionStateIcon');
			}
		}, 500);
	}
	
  	// #endregion


	// #region characters popup

	async openCharactersPopup(): Promise<void> {
		await this.finalizeCharactersPopup();

	}

	
	private async finalizeCharactersPopup(): Promise<void> {
		const popupResult = await this.matModule
			.open(CharactersPopupComponent, { data: {characters: this.initialDmoDto.characters, dmoId: this.dmoId }, width: '400px' })
			.afterClosed()
			.toPromise();

		if (!popupResult || popupResult.hasChanges === false) {
			this.matModule.ngOnDestroy();
			return;
		} 


		if (popupResult.hasChanges === true) {
			this.initialDmoDto.characters = popupResult.changes;
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

	closeBeatTypeTooltip($event: any): void {
		this.closeBeatTypeTooltipEvent.emit($event)
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
				const beatId = this.selectBeatIdFromBeatDataHolder(beatElement.nativeElement);
				const beat: NnaBeatDto = {
					beatId: beatId,
					order: i,
					text: beatElement.nativeElement.innerHTML,
					time: this.buildTimeDtoFromBeat(beatId),
					type: beatElement.nativeElement.dataset.beatType
				}
				return beat;
		});
	}

	private selectSingleBeat(index: number): NnaBeatDto {
		const beatElement = this.beatElements.toArray()[index].nativeElement;
		const beatId = this.selectBeatIdFromBeatDataHolder(beatElement);

		return {
			beatId: beatId,
			order: index,
			text: beatElement.innerHTML,
			time: this.buildTimeDtoFromBeat(beatId),
			type: beatElement.dataset.beatType
		} as NnaBeatDto
	}

	// private buildDmoWithBeatsJson() : NnaDmoWithBeatsAsJson {
	// 	let dmoWithJson : NnaDmoWithBeatsAsJson = new NnaDmoWithBeatsAsJson(); 
	// 	dmoWithJson.json = JSON.stringify(this.selectBeatDtos());
	// 	dmoWithJson.dmoId = this.dmoId;
	// 	return dmoWithJson;
	// }

	private async closeEditorAndClearData(): Promise<void> {
		await this.editorHub.sanitizeTempIds(this.dmoId);
		await this.editorHub.abortConnection();
		this.unsubscribeFromClipboard();
		this.dmoId = '';
		this.matModule.closeAll();

		this.currentShortDmo = null;
		this.isDmoInfoSet = false;
		this.beatWasSet = false;
		this.beatsLoading = true;
		this.beatsUpdating = false;
		this.initialDmoDto = null;
		this.editorIsConnected = false;
		this.editorIsReconnecting = false;

		this.updateGraphEvent = null;
		this.updateBeatsEvent = null;

		this.connectionState = null;
		this.autosaveTitle = '';
		this.connectionStateTitle = '';

		this.cdRef.detectChanges();
	}

  	// #endregion
}
