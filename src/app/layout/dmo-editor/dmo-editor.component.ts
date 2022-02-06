import { ShortDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorHub } from './services/editor-hub.service';
import { Toastr } from '../../shared/services/toastr.service';
import { Component, OnInit, OnDestroy, ElementRef, QueryList, ChangeDetectorRef } from '@angular/core';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { ToastrErrorMessage } from 'src/app/shared/models/serverResponse';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';
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

  beatsUpdating: boolean;
  
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
  private plotPointElements: QueryList<ElementRef>;   //elements
  private beatElements: QueryList<ElementRef>;        //elements
  private timePickerElements: QueryList<ElementRef>;  //elements
   // ------ [end] not state

  private unsubscribe$: Subject<void> = new Subject();
  private initialLoadSub: Subscription;

  constructor(
    private editorHub: EditorHub,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: Toastr,
    public matModule: MatDialog,
    private sidebarManagerService: SidebarManagerService,
    private cdRef: ChangeDetectorRef,
    private dataGenerator: BeatGeneratorService
    // private editorChangeDetectorService: EditorChangeDetectorService,

    ) {
      this.beatsUpdating = false; 
      this.beatWasSet = false;
      this.updateGraphEvent = new EventEmitter<any>();
      this.updateBeatsEvent = new EventEmitter<any>();
      this.beatsMetaData = [];
      this.beatsIds = [];
    }

  async ngOnInit() {
    this.isDmoInfoSet = false;
    this.isInitialPopupOpen = false;
    this.beatsLoading = true;

    //this.editorChangeDetectorService.detector.subscribe(async (updates: Array<string>) => {
      // this.beatsUpdating = true;
      // await this.editorHub.updateDmosJson(this.buildDmoWithBeatsJson());
      // this.beatsUpdating = false;

    //});

    this.activatedRoute.queryParams.subscribe(params => {
      this.dmoId = params['dmoId'];
    });

    if (this.dmoId) {
      await this.loadDmo();
    } else {
      await this.createAndInitDmo();
    }
  }


  async syncBeats(source: string) {
    console.log(`sync from ${source}`);
    let prepared = this.buildDmoWithBeatsJson();
    console.log('prepared for saving');
    console.log(prepared);
    await this.editorHub.updateDmosJson(prepared);
  }


  async ngOnDestroy() {
    this.initialLoadSub?.unsubscribe();
    await this.closeEditorAndClearData();
  }



  //#region general settings

  async createAndInitDmo() {
    const popupResult = await this.finalizePopup();
    if (!popupResult) {
      return;
    }
    await this.editorHub.startConnection();
    
    let response: EditorResponseDto;
    try {
      response = await this.editorHub.createDmo(popupResult);
    } catch (err) {
      this.showUnhandledException(err);
      return;
    }

    if (this.handleResponse(response)) {
      this.initDmo(response.data);
      this.createInitialDmo();

      this.beatsLoading = false;
      this.sidebarManagerService.collapseSidebar();
    }
  }

  async editCurrentDmo() {
    const popupResult = await this.finalizePopup();
    if (!popupResult) {
      return;
    }
    let response: EditorResponseDto;
    try {
      response = await this.editorHub.updateShortDmo(popupResult);

      if (this.handleResponse(response)) {
        await this.loadDmo();
      }

    } catch (err) {
      this.showUnhandledException(err);
      return;
    }
  }

  async loadDmo() {

    await this.editorHub.startConnection();

    let response: EditorResponseDto;
    try {
      response = await this.editorHub.loadShortDmo(this.dmoId);
    } catch(err) {
      this.showUnhandledException(err);
      return;
    }

    if (this.handleResponse(response)) {
      this.initDmo(response.data);

      if (this.currentShortDmo.hasBeats) {
        this.loadBeats();
      } else {
        this.createInitialDmo();
        this.sidebarManagerService.collapseSidebar();
      }
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
    this.initialDmoDto.isFinished = false;
    this.initialDmoDto.statusString = 'In progress';
  }

  private async finalizePopup(): Promise<ShortDmoDto> {
    let popupData = null;
    if(this.currentShortDmo) {
      popupData = this.currentShortDmo;
    }
    this.initialPopup = this.matModule.open(InitialPopupComponent, {
      data: popupData,
      width: '400px' });

    this.isInitialPopupOpen = true;

    const popupResult = await this.initialPopup.afterClosed().toPromise();
    this.isInitialPopupOpen = false;
    if (!popupResult || popupResult.cancelled) {
      return null;
    } 

    let response = new ShortDmoDto(popupResult.name, popupResult.movieTitle);
    response.shortComment = popupResult.shortComment;
    if (this.currentShortDmo && this.currentShortDmo.id) {
      response.id = this.currentShortDmo.id;
    }

    this.initialPopup = null;
    this.matModule.ngOnDestroy();
    return response;
  }

  private handleResponse(entry: EditorResponseDto) : boolean {
    if (!entry) {
      return false;
    }

    if (entry.isSuccessful) {
      return true;
    }

    if (entry.errors != null && entry.errors.length != 0) {
      entry.errors.forEach(err => console.error(err.errorMessage));
      this.toastr.error(new ToastrErrorMessage(entry.message, `${entry.httpCode} ${entry.header}`));
      return false;
    }

    if (entry.warnings != null && entry.warnings.length != 0) {
      this.toastr.warning(new ToastrErrorMessage(entry.message, `${entry.httpCode} ${entry.header}`));
      console.error('Validation result is not implemented');
      console.log('validation warnings');
      entry.warnings.forEach(war => console.log(`field: ${war.fieldName} message: ${war.validationMessage}`));
      return false;
    }

    this.showUnhandledException();
    return false;
  }

  private showUnhandledException(err?: any) {
    if (!err) {
      this.toastr.error(new ToastrErrorMessage('Unhandled exception', 'Error'));
    } else {
      this.toastr.error(new ToastrErrorMessage(err, 'Error'));
      console.error(err);
    }
  }

  private initDmo(result: ShortDmoDto) {
    this.currentShortDmo = new ShortDmoDto(result.name, result.movieTitle);

    if (result.id) {
      this.currentShortDmo.id = result.id;
      this.dmoId = result.id;
    }
    this.currentShortDmo.shortComment = result.shortComment;
    this.currentShortDmo.hasBeats = result.hasBeats;
    this.isDmoInfoSet = true;
  }

  private loadBeats() {
    let $initialLoad = this.editorHub.initialBeatsLoad(this.dmoId)
      .pipe(takeUntil(this.unsubscribe$));
      
    this.initialLoadSub = $initialLoad.subscribe({
      next: (result: any) => { 
        this.initialDmoDto = new NnaDmoDto();
        this.initialDmoDto.beats = [];

        let beats = Object.assign<NnaBeatDto[], string>([], JSON.parse(result.beatsJson));

        this.initialDmoDto.beats = beats;
        this.initialDmoDto.isFinished = result.dmoStatusId == 1; //Completed
        this.initialDmoDto.dmoId = result.dmoId;
        this.initialDmoDto.statusString = result.dmoStatus;

        this.beatsLoading = false;
        this.sidebarManagerService.collapseSidebar();
      }
    });
  }

  //#endregion


  //#region initial load

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

  //#endregion


  //#region CRUD
  
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

    let beatIdToFocus = indexToRemove == 0 
      ? 0
      : indexToRemove - 1;

      console.log(beatIdToFocus);

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

  //#endregion


  //#region helpers

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
    })
    
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

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  //#endregion
}
