import { ShortDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorHub } from './services/editor-hub.service';
import { Component, OnInit, OnDestroy, ElementRef, QueryList, ChangeDetectorRef } from '@angular/core';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { EventEmitter } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { BeatGeneratorService } from './helpers/beat-generator';
import { NnaBeatDto, NnaBeatTimeDto, NnaDmoDto, NnaDmoWithBeatsAsJson } from './models/dmo-dtos';

@Component({
	selector: 'app-dmo-editor',
	templateUrl: './dmo-editor.component.html',
	styleUrls: ['./dmo-editor.component.scss']
})
export class DmoEditorComponent implements OnInit, OnDestroy {

	isInitialPopupOpen: boolean;
	initialPopup: MatDialogRef<InitialPopupComponent>;

	connectionState: string;
	beatsUpdating: boolean;
	autosaveTitle: string;
	connectionStateTitle: string;
	private savingIsDoneTitle: string = "Your work is autosaved";
	private savingInProgressTitle: string = "Your work is saving";
	editorIsConnected: boolean;
	
	// initial fields
	isDmoInfoSet: boolean;
	beatsLoading: boolean;
	dmoId: string;
	currentShortDmo: ShortDmoDto;
	initialDmoDto: NnaDmoDto;
	beatWasSet: boolean;



	// events
	updateGraphEvent: EventEmitter<any>;
	updateBeatsEvent: EventEmitter<any>;

	// ------ [start] not state
	private isDmoFinised: boolean;
	private beatsMetaData: any[];
	private beatsIds: string[];
	private plotPointElements: QueryList<ElementRef>;   // elements
	private beatElements: QueryList<ElementRef>;        // elements
	private timePickerElements: QueryList<ElementRef>;  // elements
   // ------ [end] not state

	private unsubscribe$: Subject<void> = new Subject();
	private initialLoadSub: Subscription;

	constructor(
		private editorHub: EditorHub,
		private activatedRoute: ActivatedRoute,
		private router: Router,
		public matModule: MatDialog,
		private sidebarManagerService: SidebarManagerService,
		private cdRef: ChangeDetectorRef,
		private dataGenerator: BeatGeneratorService		) {
		// private editorChangeDetectorService: EditorChangeDetectorService,
		this.beatsUpdating = false; 
		this.beatWasSet = false;
		this.isDmoInfoSet = false;
		this.isInitialPopupOpen = false;
		this.beatsLoading = false;
		this.updateGraphEvent = new EventEmitter<any>();
		this.updateBeatsEvent = new EventEmitter<any>();
		this.beatsMetaData = [];
		this.beatsIds = [];
	}

	async ngOnInit() {
		// this.editorChangeDetectorService.detector.subscribe(async (updates: Array<string>) => {
		// this.beatsUpdating = true;
		// await this.editorHub.updateDmosJson(this.buildDmoWithBeatsJson());
		// this.beatsUpdating = false;

		// });

		this.activatedRoute.queryParams.subscribe(params => {
			this.dmoId = params['dmoId'];
		});

		this.dmoId 
			? await this.loadDmo()
			: await this.createDmo();
	}

	async prepareEditor(): Promise<void> {
		await this.editorHub.startConnection();
		this.setConnectionView();
		this.editorHub.onConnectionChanged.subscribe(() => this.setConnectionView());
		this.autosaveTitle = this.savingIsDoneTitle;
	}

	setConnectionView(): void {
		if (this.editorHub.isConnected) {
			this.editorIsConnected = true;
			this.connectionState = "online";
			this.connectionStateTitle = "Connections is established";
		} else if (this.editorHub.isReconnecting) {
			this.editorIsConnected = true;
			this.connectionState = "connecting";
			this.connectionStateTitle = "Editor is connecting";
		} else {
			this.editorIsConnected = false;
			this.connectionState = "offline";
			this.connectionStateTitle = "Editor is disconnected";
		}
	}

	async tryReconnect() {
		await this.editorHub.startConnection();
		this.setConnectionView();
		this.editorHub.onConnectionChanged.subscribe(() => this.setConnectionView());
		await this.syncBeats("manually");
	}

	async syncBeats(source: string) {
		// console.log(`sync from ${source}`);
		let prepared = this.buildDmoWithBeatsJson();
		// console.log('prepared for saving');
		// console.log(prepared);
		this.beatsUpdating = true;
		this.autosaveTitle = this.savingInProgressTitle;
		await this.editorHub.updateDmosJson(prepared);
		this.beatsUpdating = false;
		this.autosaveTitle = this.savingIsDoneTitle;

		console.log('beats was synced')
	}


	async ngOnDestroy() {
		this.initialLoadSub?.unsubscribe();
		await this.closeEditorAndClearData();
	}



  	// #region general settings

	async createDmo() {
		const popupResult = await this.finalizePopup();
			if (!popupResult) {
			return;
		}

		await this.prepareEditor();
		const createdDmo = await this.editorHub.createDmo(popupResult);
		if (createdDmo == null) {
			return;
		}

		this.initDmo(createdDmo);
		this.createInitialDmo();
	}
	

	async editCurrentDmo() {
		const popupResult = await this.finalizePopup();
		if (!popupResult) {
			return;
		}
		const response = await this.editorHub.updateShortDmo(popupResult);
		if (this.editorHub.isResponseFailed(response)) {
			return;
		}
		this.initDmo(popupResult);
	}

	async loadDmo() {
		await this.prepareEditor();

		const shortDmo = await this.editorHub.loadShortDmo(this.dmoId);
		if (shortDmo == null) {
			return;
		}

		this.initDmo(shortDmo);
		if (this.currentShortDmo.hasBeats) {
			this.beatsLoading = true;
			this.loadBeats();
		} else {
			this.createInitialDmo();
		}
	}

	async closeEditor() {
		if (!this.sidebarManagerService.IsOpen) {
			this.sidebarManagerService.toggleSidebar();
		}
		await this.closeEditorAndClearData();
		this.router.navigate([], { queryParams: {dmoId: null}, replaceUrl: true, relativeTo: this.activatedRoute });
	}

	private createInitialDmo() {
		this.initialDmoDto = new NnaDmoDto();
		this.initialDmoDto.beats = [];
		this.initialDmoDto.beats.push(this.dataGenerator.createNnaBeatWithDefaultData());
		this.sidebarManagerService.collapseSidebar();
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

		let newDmoDetails = new ShortDmoDto(popupResult.name, popupResult.movieTitle);
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
		if (!this.currentShortDmo) {
			this.currentShortDmo = new ShortDmoDto(result.name, result.movieTitle);
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

		this.isDmoInfoSet = true;
	}

	private loadBeats() {
		let $initialLoad = this.editorHub.initialBeatsLoad(this.dmoId)
			.pipe(takeUntil(this.unsubscribe$));
		
		this.initialLoadSub = $initialLoad.subscribe((result: any) => { 
			this.initialDmoDto = new NnaDmoDto();
			this.initialDmoDto.beats = [];

			let beats = Object.assign<NnaBeatDto[], string>([], JSON.parse(result.beatsJson));

			this.initialDmoDto.beats = beats;
			this.initialDmoDto.dmoId = result.dmoId;

			this.beatsLoading = false;
			this.sidebarManagerService.collapseSidebar();
		});
	}

  	// #endregion




	  
    // #region initial load

	async beatsSet(callbackResult: any): Promise<void> {
		this.beatElements = callbackResult.beats;
		this.timePickerElements = callbackResult.timePickers;
		this.beatsMetaData = callbackResult.beatMetadata
		this.beatsIds = callbackResult.beatsIds;
		this.beatWasSet = true;
		this.cdRef.detectChanges();

		if (callbackResult.lastAction != null) {
			await this.syncBeats(callbackResult.lastAction);
		}
	}

	plotPointsSet(callbackResult): void {
		this.plotPointElements = callbackResult.elements;
	}

	buildBeatsData() {
		let plotPointsData: NnaBeatDto[] = [];

		this.initialDmoDto.beats.map(b => b).forEach((beatDto: NnaBeatDto, i) => {
			plotPointsData.push(beatDto);
		});

		return plotPointsData;
	}

	buildPlotPointsData() {
		let plotPointsData: any[] = [];

		this.beatElements.forEach((beatElement, i) => {
			plotPointsData.push({beatId: this.beatsIds[i], plotPointMetaData: this.beatsMetaData[i], order: i});
		});

		return plotPointsData;
	}

	private selectBeatDtos(): NnaBeatDto[] {
		// console.log(this.beatsMetaData);
		// let dtos = this.beatElements
		// .filter((element, i) => {
		//   if (this.beatsMetaData[i].isDirty == true) {
		//     this.beatsMetaData[i].isDirty = undefined;
		//     return true;
		//   }
		//   return false;
		// })
		return this.beatElements.map((beatElement, i) => {
				let beatId = this.selectBeatIdFromBeatDataHolder(beatElement.nativeElement);
				let beat: NnaBeatDto = {
				beatId: beatId,
				order: i,
				text: beatElement.nativeElement.innerHTML,
				time: this.buildTimeDtoFromBeat(beatId)
			}
			return beat;
		});
		// console.log(this.beatsMetaData);
		// return dtos;
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
		let newBeat = this.dataGenerator.createNnaBeatWithDefaultData();
		beats.splice(indexToInsert + 1, 0 , newBeat)
		beats = this.orderBeats(beats);

		this.updateBeatsEvent.emit({ beats: beats, isFinished: this.isDmoFinised, timePickerToFocus: newBeat.beatId, actionName: 'add' });
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

		let beatIdToFocus = indexToRemove == 0 ? 0 : indexToRemove - 1;

		this.updateBeatsEvent.emit({ beats: beats, isFinished: this.isDmoFinised, beatIdToFocus: this.beatsIds[beatIdToFocus], actionName: 'remove' });
		this.updatePlotPoints();
	}

	private updatePlotPoints() {
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

	private buildDmoWithBeatsJson() : NnaDmoWithBeatsAsJson {
		let dmoWithJson : NnaDmoWithBeatsAsJson = new NnaDmoWithBeatsAsJson(); 
		dmoWithJson.json = JSON.stringify(this.selectBeatDtos());
		dmoWithJson.dmoId = this.dmoId;
		return dmoWithJson;
	}

	private async closeEditorAndClearData() {
		await this.editorHub.abortConnection();
		this.dmoId = '';
		this.isDmoInfoSet = false;
		this.isInitialPopupOpen = false;
		this.matModule.closeAll();
		this.initialPopup = null;
		this.currentShortDmo = null;
		if (this.sidebarManagerService.IsOpen == false) {
			this.sidebarManagerService.toggleSidebar();
		}

		this.unsubscribe$.next();
		this.unsubscribe$.complete();
	}

  	// #endregion
}
