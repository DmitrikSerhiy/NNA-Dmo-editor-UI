import { DmoDetailsShortDto } from './../models';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorHub } from './services/editor-hub.service';
import { Component, OnInit, OnDestroy, ElementRef, QueryList, ChangeDetectorRef, ChangeDetectionStrategy, AfterViewInit, ViewChild } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { BeatGeneratorService } from './helpers/beat-generator';
import { BeatToMoveDto, BeatsToSwapDto, CreateBeatDto, NnaDmoDto, RemoveBeatDto, UpdateBeatType } from './models/dmo-dtos';
import { CharactersPopupComponent } from '../../shared/components/characters-popup/characters-popup.component';
import { NnaTooltipService } from 'src/app/shared/services/nna-tooltip.service';
import { DmoDetailsPopupComponent } from '../../shared/components/dmo-details-popup/dmo-details-popup.component';
import { EditorSharedService } from '../../shared/services/editor-shared.service';
import { PublishDmoPopupComponent } from './components/publish-dmo-popup/publish-dmo-popup.component';

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
	currentShortDmo: DmoDetailsShortDto;
	initialDmoDto: NnaDmoDto;
	beatWasSet: boolean = false;
	showControlPanel: boolean = false;
	editorIsConnected: boolean = false;
	editorIsReconnecting: boolean = false;
	beatsUpdating: boolean = false;

	// events
	updateGraphEvent: EventEmitter<any> = new EventEmitter<any>();
	updateBeatsEvent: EventEmitter<any> = new EventEmitter<any>();
	updateCharactersEvent: EventEmitter<any> = new EventEmitter<any>();
	focusElementEvent: EventEmitter<any> = new EventEmitter<any>();
	openBeatTypeTooltipEvent: EventEmitter<any> = new EventEmitter<any>();
	focusElementInBeatsFlowEvent: EventEmitter<any> = new EventEmitter<any>();

	// ------ [start] not state
	private isDmoFinised: boolean;
	isDmoPublished: boolean;
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
		private nnaTooltipService: NnaTooltipService,
		private editorSharedService: EditorSharedService
		) { }

	async ngOnInit(): Promise<void> {
		this.activatedRoute.queryParams.subscribe((params) => {
			this.dmoId = params['dmoId'];
			this.cdRef.detectChanges();
		});

		window.onbeforeunload = () => this.sanitizeEditor();
		document.addEventListener('keydown', this.hideAllTooltipsWrapper);
	}

	async ngAfterViewInit(): Promise<void> {
		await this.loadData();
		this.subscribeToClipboard();
	}

	// #region general settings

	async tryReconnect(): Promise<void> {
		this.clearConnectionState();
		this.clearData();
		await this.loadData();
		console.clear()
		// todo: what if user have some unsaved work here??? offer to swith to offline mode here or mark not saved changes. OR disable all editor fields
	}

	async loadData(): Promise<void> {
		await this.loadDmoDetails();
		await this.prepareEditor();
		await this.loadDmoBeatsAndCharacters(true);
	}

	async reloadData(): Promise<void> {
		await this.loadDmoDetails();
		await this.loadDmoBeatsAndCharacters(true);
	}



	async reloadBeatsAndCharacters(): Promise<void> {
		this.autosaveTitle = this.savingInProgressTitle;
		this.cdRef.detectChanges();
		this.clearBeatsAndCharacters();

		setTimeout(async () => {
			await this.loadDmoBeatsAndCharacters(false); // sanitization was made during character update/delete request
			this.autosaveTitle = this.savingIsDoneTitle;
			this.cdRef.detectChanges();
		}, 800);
	}

	async prepareEditor(): Promise<void> {
		await this.editorHub.startConnection();
		this.setConnectionView();
		this.editorHub.onConnectionChanged.subscribe(async (shouldReloadEditor: boolean) => {
			if (!shouldReloadEditor) {
				this.setConnectionView(true);
				return
			}
			this.clearData();
			this.reloadData();
			this.setConnectionView(true);
			console.clear()
		});
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
			$event.source == 'detach_character_from_beat' ||
			$event.source == 'attach_tag_to_beat' ||
			$event.source == 'detach_tag_from_beat' ||
			$event.source == 'paste_text') {
			await this.editorHub.updateBeat(this.editorSharedService.selectSingleBeatForServer($event.metaData, this.beatElements, this.timePickerElements));
		} else if ($event.source == 'swap') {
			await this.editorHub.swapBeats($event.metaData);
		} else if ($event.source == 'move') {
			await this.editorHub.moveBeats($event.metaData);
		}
		this.autosaveTitle = this.savingIsDoneTitle;
		this.beatsUpdating = false;
		this.cdRef.detectChanges();

		// let build = this.buildDmoWithBeatsJson();
		// await this.editorHub.updateDmosJson(build);

		console.log(`beats was synced. Source: ${$event.source}`);
	}

	async ngOnDestroy(): Promise<void> {
		document.removeEventListener('keydown', this.hideAllTooltipsWrapper);
		await this.sanitizeEditor();
	}

	async closeEditor(): Promise<void> {
		this.router.navigate(['app/dmos']);
	}

	private hideAllTooltipsWrapper = async function($event) {
		const key = $event.which || $event.keyCode || $event.charCode;
		if (key == 27) { // escape
			this.nnaTooltipService.hideAllTooltips();
		}	
	}.bind(this);

	private subscribeToClipboard() {
		document.addEventListener('paste', this.pasteSanitizerWrapper);
		this.cdRef.detectChanges();
	}

	private async pasteSanitizer($event: any): Promise<void> {
		if ($event.target.nodeName != "DIV" || !$event.target.className.includes("beat-data-holder")) {
			return;
		}
		$event.preventDefault();
		const paste = $event.clipboardData.getData('text');
		if (!paste?.length) {
			return;
		}
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		
		selection.getRangeAt(0).insertNode(document.createTextNode(paste));
		selection.collapseToEnd();
		await this.syncBeats({source: 'paste_text', metaData: $event.target.dataset.order});
	}

	private unsubscribeFromClipboard() {
		document.removeEventListener('paste', this.pasteSanitizerWrapper);
	}

	private pasteSanitizerWrapper = async function($event) {
		await this.pasteSanitizer($event);
	}.bind(this);


	private async loadDmoDetails(): Promise<void> {
		this.currentShortDmo = await this.editorHub.getDmoDetailsShort(this.dmoId);
		this.isDmoFinised = this.currentShortDmo.dmoStatusId === 1;
		this.isDmoPublished = this.currentShortDmo.published;
		this.isDmoInfoSet = true
		this.showControlPanel = true;
		this.cdRef.detectChanges();
	}

	private async loadDmoBeatsAndCharacters(sanitizeBeforeLoad: boolean): Promise<void> {
		const dmoWithData = await this.editorHub.initialDmoLoadWithData(this.dmoId, sanitizeBeforeLoad);
		this.initialDmoDto = new NnaDmoDto(this.dmoId);
		if (!dmoWithData?.beats?.length) {
			this.initialDmoDto.beats.push(this.dataGenerator.createNnaBeatWithDefaultData());
			
			const initialBeat = {
				dmoId: this.dmoId,
				order: 0,
				tempId: this.initialDmoDto.beats[0].beatId,
				type: 1,
				charactersInBeat: [],
				tagsInBeat: []
			} as CreateBeatDto;
	
			await this.editorHub.addBeat(initialBeat);		
		} else {
			this.initialDmoDto.beats = dmoWithData.beats;
		}

		this.initialDmoDto.characters = dmoWithData.characters;
		this.beatsLoading = false;
		this.cdRef.detectChanges();
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

			if (!this.editorHub.isConnected) {
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

			clearInterval(intervalId);
			this.cdRef.detectChanges();
		}, 1000);
	}

	async changePublishState(shouldState: boolean): Promise<void> {
		this.nnaTooltipService.hideAllTooltips();
		const popupResult = await this.matModule
			.open(PublishDmoPopupComponent, { data: { shouldPublish: shouldState }, width: '500px' })
			.afterClosed()
			.toPromise();

		if (!popupResult) {
			this.matModule.ngOnDestroy();
			return;
		}
		
		if (shouldState) {
			await this.editorHub.publishDmo(this.dmoId);
		} else if (!shouldState) {
			await this.editorHub.unpublishDmo(this.dmoId);
		}

		this.currentShortDmo.published = shouldState;
		this.isDmoPublished = shouldState;
		this.cdRef.detectChanges();
	}

	showConnectionStateTooltip(): void {
		this.nnaTooltipService.showTooltip(this.nnaTooltipService.connectionStateTooltipName);
	}

	hideConnectionStateTooltop(): void {
		this.nnaTooltipService.hideTooltip(this.nnaTooltipService.connectionStateTooltipName);
	}

	showConnectionStateIconTooltip(): void {
		this.nnaTooltipService.showTooltip(this.nnaTooltipService.connectionStateIconTooltipName);
	}

	hideConnectionStateIconTooltop(): void {
		this.nnaTooltipService.hideTooltip(this.nnaTooltipService.connectionStateIconTooltipName);
	}

	async editDmoDetails() {
		this.nnaTooltipService.hideAllTooltips();
		const dmoDetailsPopup = this.matModule.open(DmoDetailsPopupComponent, { data: { dmoId: this.dmoId, readonly: false }, width: '600px' });
		const popupResult = await dmoDetailsPopup.afterClosed().toPromise();

		if (!popupResult || popupResult.cancelled) {
			return;
		} 

		if (popupResult.tabs.includes('details')) {
			this.currentShortDmo = await this.editorHub.getDmoDetailsShort(this.dmoId);
			this.isDmoFinised = this.currentShortDmo.dmoStatusId === 1;
			this.updatePlotPoints();
			this.cdRef.detectChanges();
		}
	}


  	// #endregion

	// #region tags 

	async syncTagsInBeats($event: any): Promise<void> {
		if ($event.operation == 'attach') {
			await this.editorHub.attachTagToBeat($event.data.id, this.dmoId, $event.data.beatId, $event.data.tagId);
		} else if ($event.operation == 'detach') {
			await this.editorHub.detachTagFromBeat($event.data.id, this.dmoId, $event.data.beatId);
		} else {
			return;
		}

		console.log(`Tags in beats sync: id: ${$event.data.id}. Operation: ${$event.operation}`);
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
		let characterBeats = this.editorSharedService.selectBeatDtos(this.beatElements, this.timePickerElements);
		characterBeats = characterBeats.filter(beat => beat.type == 3);
		const popupResult = await this.matModule
			.open(CharactersPopupComponent, { data: { dmoId: this.dmoId, beats: characterBeats, readonly: false, openOnAction: openOnAction }, width: '600px' })
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

	async reorderBeats($event: any): Promise<void> {
		if ($event.operation == 'swap') {
			let beats = this.editorSharedService.selectBeatDtos(this.beatElements, this.timePickerElements);
			const beatsToSwap = $event.data as BeatsToSwapDto;
			beats.forEach(beat => {
				if (beat.beatId == 	beatsToSwap.beatToMove.id) {
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

		} else if ($event.operation == 'move') {
			let beats = this.editorSharedService.selectBeatDtos(this.beatElements, this.timePickerElements);
			const beatToMove =  $event.data as BeatToMoveDto;
			if (beatToMove.order == beatToMove.previousOrder) {
				return;
			}
			beats.forEach(beat => {
				if (beat.beatId == beatToMove.id) {
					beat.order = beatToMove.order;
				} else {
					if (beat.order > beatToMove.previousOrder && beat.order <= beatToMove.order) {
						beat.order = beat.order - 1;
					} else if (beat.order < beatToMove.previousOrder &&  beat.order >= beatToMove.order) {
						beat.order = beat.order + 1;
					}
				}
			});

			const sortedBeats = beats.sort((a, b) => Number(a.order) - Number(b.order));
			beatToMove.dmoId = this.dmoId;
			this.updateBeatsEvent.emit({ beats: sortedBeats, isFinished: this.isDmoFinised, actionName: 'move', actionMetaData: beatToMove });
			this.updatePlotPoints();
		}
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
		let beats = this.editorSharedService.selectBeatDtos(this.beatElements, this.timePickerElements);
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

	lineCountChanged(change: any): void {
		this.beatsIds.forEach((beatId, i) => {
			if (beatId == change.beatId) {
				this.beatsMetaData[i] = { lineCount: change.newLineCount.lineCount, lines: change.newLineCount.lines };
				return;
			}
		});

		this.updatePlotPoints();
	}
  
	finishDmo(): void {
		this.isDmoFinised = !this.isDmoFinised;
		this.updatePlotPoints();
	}


	addBeatByButton(): void {
		let beats = this.editorSharedService.selectBeatDtos(this.beatElements, this.timePickerElements);
		const newBeat = this.dataGenerator.createNnaBeatWithDefaultData();
		beats.push(newBeat);
		beats = this.editorSharedService.orderBeats(beats);
		const newBeatDto = this.dataGenerator.getCreatedBeatDto(newBeat, this.dmoId);
		this.updateBeatsEvent.emit({ beats: beats, isFinished: this.isDmoFinised, timePickerToFocus: newBeat.beatId, actionName: 'add', actionMetaData: newBeatDto});
		this.updatePlotPoints();
	}

	removeBeatByButton(beatId: string): void {
		this.removeBeat({beatIdToRemove: beatId})
	} 

  	addBeat(fromBeat: any): void {
		let indexToInsert: number;
		this.beatsIds.forEach((beatId, i) => {
			if (beatId == fromBeat.beatIdFrom) {
				indexToInsert = i;
				return;
			}
		});

		let beats = this.editorSharedService.selectBeatDtos(this.beatElements, this.timePickerElements);
		const newBeat = this.dataGenerator.createNnaBeatWithDefaultData();
		beats.splice(indexToInsert + 1, 0 , newBeat);
		beats = this.editorSharedService.orderBeats(beats);
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

		let beats = this.editorSharedService.selectBeatDtos(this.beatElements, this.timePickerElements);
		beats.splice(indexToRemove, 1);
		beats = this.editorSharedService.orderBeats(beats);

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

	// private buildDmoWithBeatsJson() : NnaDmoWithBeatsAsJson {
	// 	let dmoWithJson : NnaDmoWithBeatsAsJson = new NnaDmoWithBeatsAsJson(); 
	// 	dmoWithJson.json = JSON.stringify(this.selectBeatDtos());
	// 	dmoWithJson.dmoId = this.dmoId;
	// 	return dmoWithJson;
	// }

	private clearData(): void {
		this.clearBeatsAndCharacters();
		this.clearDmoDetails();
	}

	private clearBeatsAndCharacters(): void {
		this.beatWasSet = false;
		this.beatsLoading = true;
		this.beatsUpdating = false;
		this.initialDmoDto = null;
		this.nnaTooltipService.hideAllTooltips();
		this.cdRef.detectChanges();
	}

	private clearDmoDetails(): void {
		this.showControlPanel = false;
		this.isDmoInfoSet = false;
		this.currentShortDmo = null;
		this.matModule.closeAll();
		this.cdRef.detectChanges();
	}

	private async clearConnectionState(): Promise<void> {
		await this.editorHub.abortConnection();
		this.editorIsConnected = false;
		this.editorIsReconnecting = false;
		this.connectionState = "offline";
		this.connectionStateTitle = this.connectionDisconnectedTitle;
		this.autosaveTitle = this.autoSavingIsNotWorking;
		this.cdRef.detectChanges();
	}

	private async sanitizeEditor(): Promise<void> {
		await this.clearConnectionState();
		this.clearData();
		this.unsubscribeFromClipboard();
		this.dmoId = '';

		this.updateGraphEvent = null;
		this.updateBeatsEvent = null;
		this.updateCharactersEvent = null;
		this.focusElementEvent = null;
		this.openBeatTypeTooltipEvent = null;
		this.focusElementInBeatsFlowEvent = null;

		this.cdRef.detectChanges();
	}

}
