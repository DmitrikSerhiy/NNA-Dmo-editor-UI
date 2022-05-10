import { ShortDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorHub } from './services/editor-hub.service';
import { Component, OnInit, OnDestroy, ElementRef, QueryList, ChangeDetectorRef, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { EventEmitter } from '@angular/core';
import { BeatGeneratorService } from './helpers/beat-generator';
import { CreateBeatDto, NnaBeatDto, NnaBeatTimeDto, NnaDmoDto, RemoveBeatDto } from './models/dmo-dtos';

@Component({
	selector: 'app-dmo-editor',
	templateUrl: './dmo-editor.component.html',
	styleUrls: ['./dmo-editor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DmoEditorComponent implements OnInit, AfterViewInit, OnDestroy {

	isInitialPopupOpen: boolean;
	initialPopup: MatDialogRef<InitialPopupComponent>;

	connectionState: string;
	autosaveTitle: string;
	connectionStateTitle: string;

	private savingIsDoneTitle: string = "Your progress was auto-saved";
	private savingInProgressTitle: string = "Your progress is saving";
	private autoSavingIsNotWorking: string = "Your progress won't be auto-saved";
	
	// initial fields
	isDmoInfoSet: boolean;
	beatsLoading: boolean;
	dmoId: string;
	currentShortDmo: ShortDmoDto;
	initialDmoDto: NnaDmoDto;
	beatWasSet: boolean;
	editorIsConnected: boolean;
	editorIsReconnecting: boolean;
	beatsUpdating: boolean;

	// events
	updateGraphEvent: EventEmitter<any>;
	updateBeatsEvent: EventEmitter<any>;

	// ------ [start] not state
	private isDmoFinised: boolean;
	private beatsMetaData: any[];
	private beatsIds: string[];
	private plotPointsWithMetaData: any[];

	private plotPointElements: QueryList<ElementRef>;   // elements
	private beatElements: QueryList<ElementRef>;        // elements
	private timePickerElements: QueryList<ElementRef>;  // elements
   // ------ [end] not state

	constructor(
		private editorHub: EditorHub,
		private activatedRoute: ActivatedRoute,
		private router: Router,
		public matModule: MatDialog,
		private sidebarManagerService: SidebarManagerService,
		private cdRef: ChangeDetectorRef,
		private dataGenerator: BeatGeneratorService) {
			this.beatsUpdating = false; 
			this.beatWasSet = false;
			this.isDmoInfoSet = false;
			this.isInitialPopupOpen = false;
			this.beatsLoading = true;
			this.updateGraphEvent = new EventEmitter<any>();
			this.updateBeatsEvent = new EventEmitter<any>();
			this.beatsMetaData = [];
			this.beatsIds = [];
			this.plotPointsWithMetaData = [];
	}

	async ngOnInit(): Promise<void> {
		this.activatedRoute.queryParams.subscribe(params => {
			this.dmoId = params['dmoId'];
		});
	}

	async ngAfterViewInit(): Promise<void> {
		this.dmoId 
			? await this.loadDmo()
			: await this.createDmo();
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
		} else if ($event.source == 'beat_data_holder_focus_out' || $event.source == 'time_picker_focus_out') {
			await this.editorHub.updateBeat(this.selectSingleBeat($event.metaData));
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

	async createDmo(): Promise<void> {
		const popupResult = await this.finalizePopup();
			if (!popupResult) {
			return;
		}

		await this.prepareEditor();
		const createdDmo = await this.editorHub.createDmo(popupResult);

		this.initDmo(createdDmo);
		this.initialDmoDto.beats.push(this.dataGenerator.createNnaBeatWithDefaultData());
		this.cdRef.detectChanges();

		const initialBeat = {
			dmoId: this.dmoId,
			order: 0,
			tempId: this.initialDmoDto.beats[0].beatId
		} as CreateBeatDto;

		await this.editorHub.addBeat(initialBeat);

		this.beatsLoading = false;
		this.sidebarManagerService.collapseSidebar();
		this.cdRef.detectChanges();
	}
	

	async editCurrentDmo(): Promise<void> {
		const popupResult = await this.finalizePopup();
		if (!popupResult) {
			return;
		}
		await this.editorHub.updateShortDmo(popupResult);
		this.initDmo(popupResult);
	}

	async loadDmo() {
		await this.prepareEditor();
		await this.loadDmoWithBeats();
		this.cdRef.detectChanges();
	}

	async closeEditor(): Promise<void> {
		if (!this.sidebarManagerService.IsOpen) {
			this.sidebarManagerService.toggleSidebar();
		}
		await this.closeEditorAndClearData();
		this.router.navigate([], { queryParams: {dmoId: null}, replaceUrl: true, relativeTo: this.activatedRoute });
	}

	private async finalizePopup(): Promise<ShortDmoDto> {
		let popupData = null;
		if (this.currentShortDmo) {
			popupData = this.currentShortDmo;
		}
		this.initialPopup = this.matModule.open(InitialPopupComponent, { data: popupData, width: '400px' });
		this.isInitialPopupOpen = true;

		const popupResult = await this.initialPopup.afterClosed().toPromise();
		this.isInitialPopupOpen = false;
		if (!popupResult || popupResult.cancelled) {
			return null;
		} 

		let newDmoDetails = { name: popupResult.name, movieTitle: popupResult.movieTitle } as ShortDmoDto;
		newDmoDetails.shortComment = popupResult.shortComment;
		newDmoDetails.dmoStatus = +popupResult.dmoStatus;
		if (this.currentShortDmo && this.currentShortDmo.id) {
			newDmoDetails.id = this.currentShortDmo.id;
		}

		this.initialPopup = null;
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

		this.isDmoInfoSet = true;
	}

	private async loadBeats(): Promise<void> {
		this.beatsLoading = true;
		const beats = await this.editorHub.initialBeatsLoadBeatsAsArray(this.dmoId);
		if (beats?.length == 0) {
			this.initialDmoDto.beats.push(this.dataGenerator.createNnaBeatWithDefaultData());
		} else {
			this.initialDmoDto.beats = beats;
		}

		this.cdRef.detectChanges();
		this.beatsLoading = false;
		this.sidebarManagerService.collapseSidebar();
		this.cdRef.detectChanges();
	}

	private async loadDmoWithBeats() {
		const shortDmo = await this.editorHub.loadShortDmo(this.dmoId);
		if (!shortDmo) {
			return;
		}

		this.initDmo(shortDmo);
		await this.loadBeats();
	}

	private setConnectionView(): void {
		if (this.editorHub.isConnected) {
			this.editorIsConnected = true;
			this.editorIsReconnecting = false;
			this.connectionState = "online";
			this.connectionStateTitle = "Connections is established";
			this.autosaveTitle = this.savingIsDoneTitle;
		} else if (this.editorHub.isReconnecting) {
			this.editorIsConnected = false;
			this.editorIsReconnecting = true;
			this.connectionState = "connecting";
			this.connectionStateTitle = "Editor is reconnecting. Wait a few seconds.";
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

	
  	// #endregion




	  
    // #region callbacks from children

	async beatsSet(callbackResult: any): Promise<void> {
		this.beatElements = callbackResult.beats;
		this.timePickerElements = callbackResult.timePickers;
		this.beatsMetaData = callbackResult.beatMetadata
		this.beatsIds = callbackResult.beatsIds;
		this.plotPointsWithMetaData = this.beatElements.map((beatElement, i) => { return {beatId: this.beatsIds[i], plotPointMetaData: this.beatsMetaData[i], order: i} }); 

		this.beatWasSet = true;
		this.cdRef.detectChanges();

		if (callbackResult.lastAction != null) {
			await this.syncBeats({source: callbackResult.lastAction, metaData: callbackResult.lastActionMetaData});
		}
	}

	plotPointsSet(callbackResult): void {
		this.plotPointElements = callbackResult.elements;
		this.cdRef.detectChanges();
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
		this.beatsIds.forEach((beatId, i) => {
			newPlotPoints.push({beatId: beatId, plotPointMetaData: this.beatsMetaData[i], order: i});
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
					time: this.buildTimeDtoFromBeat(beatId)
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
			time: this.buildTimeDtoFromBeat(beatId)
		} as NnaBeatDto
	}

	// private buildDmoWithBeatsJson() : NnaDmoWithBeatsAsJson {
	// 	let dmoWithJson : NnaDmoWithBeatsAsJson = new NnaDmoWithBeatsAsJson(); 
	// 	dmoWithJson.json = JSON.stringify(this.selectBeatDtos());
	// 	dmoWithJson.dmoId = this.dmoId;
	// 	return dmoWithJson;
	// }

	private async closeEditorAndClearData(): Promise<void> {
		await this.editorHub.abortConnection();
		this.dmoId = '';
		this.isInitialPopupOpen = false;
		this.matModule.closeAll();

		this.initialPopup = null;
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

		if (this.sidebarManagerService.IsOpen == false) {
			this.sidebarManagerService.toggleSidebar();
		}
		
		this.cdRef.detectChanges();
	}

  	// #endregion
}
