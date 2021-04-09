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
import { BeatDto, DmoDto, DmoDtoAsJson, PlotPointDto } from './models/editorDtos';
import { EventEmitter } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { EditorChangeDetectorService } from './helpers/editor-change-detector';
// import { ChangeType } from './models/changeTypes';
import { BeatGeneratorService } from './helpers/beat-generator';
import { NnaBeatDto, NnaBeatTimeDto, NnaDmoDto } from './models/dmo-dtos';




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
  private plotPointElements: QueryList<ElementRef>; //elements
  private beatElements: QueryList<ElementRef>; //elements
  private timePickerElements: QueryList<ElementRef>; //elements
   // ------ [end] not state

  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private editorHub: EditorHub,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: Toastr,
    public matModule: MatDialog,
    private sidebarManagerService: SidebarManagerService,
    private cdRef: ChangeDetectorRef,
    // private editorChangeDetectorService: EditorChangeDetectorService,
    private dataGenerator: BeatGeneratorService
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

    this.initialDmoDto = this.buildDto();
    this.isDmoFinised = this.initialDmoDto.isFinished;
    this.beatsLoading = false;
    this.isDmoInfoSet = true;

    //this.editorChangeDetectorService.detector.subscribe(async (updates: Array<string>) => {
      // this.beatsUpdating = true;
      // await this.editorHub.updateDmosJson(this.buildDmoWithBeatsJson());
      // this.beatsToSend = [];
      // this.beatsUpdating = false;

    //});

    this.activatedRoute.queryParams.subscribe(params => {
      this.dmoId = params['dmoId'];
    });

    // if (this.dmoId) {
    //   await this.loadDmo();
    // } else {
    //   await this.createAndInitDmo();
    // }
  }

  async ngOnDestroy() {
    await this.closeEditorAndClearData();
  }




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
      //this.currentDmo.beats.push(this.dataGenerator.createBeatWithDefaultData());
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
        // this.currentDmo.beats = [];
        // this.currentDmo.beats.push(this.dataGenerator.createBeatWithDefaultData());
      }

      this.sidebarManagerService.collapseSidebar();
    }
  }

  async closeEditor() {
    await this.closeEditorAndClearData();
    this.router.navigate([], { queryParams: {dmoId: null}, replaceUrl: true, relativeTo: this.activatedRoute });
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
    //this.currentDmo = new DmoDto();

    if (result.id) {
      this.currentShortDmo.id = result.id;
      this.dmoId = result.id;
      //this.currentDmo.dmoId = result.id;
    }
    this.currentShortDmo.shortComment = result.shortComment;
    this.currentShortDmo.hasBeats = result.hasBeats;
    //this.currentDmo.beats = [];

    this.isDmoInfoSet = true;
  }

  private loadBeats() {
    let $initialLoad = this.editorHub.initialBeatsLoad(this.dmoId)
      .pipe(takeUntil(this.unsubscribe$));
      
    $initialLoad.subscribe({
      next: (result: any) => { 
        //let beats = Object.assign([], JSON.parse(result.beatsJson, this.selectBeatsFromString));

        // this.currentDmo.dmoId = result.dmoId;
        // this.currentDmo.beats = result.beatsJson;
        // this.currentDmo.isFinished = result.dmoStatusId == 1; //Completed
        // this.currentDmo.statusString = result.dmoStatus;
        this.initialDmoDto = this.buildDto();
        this.beatsLoading = false;
      },
      error: (err) => { this.toastr.error(err); }
    });
  }

  beatsSet(calculatedBeats: any): void {
    console.log(calculatedBeats);
    console.log('beat set');
    this.beatElements = calculatedBeats.beats;
    this.timePickerElements = calculatedBeats.timePickers;
    this.beatsMetaData = calculatedBeats.beatMetadata
    this.beatsIds = calculatedBeats.beatsIds;
    this.beatWasSet = true;
    this.cdRef.detectChanges();
  }

  plotPointsSet(plotPoints): void {
    this.plotPointElements = plotPoints.elements;
    console.log('plotPoints rendered');
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
  }




  // ------- [start] CRUD
  
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

    this.updateBeatsEvent.emit({ beats: beats, isFinished: this.isDmoFinised, timePickerToFocus: newBeat.beatId });
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

    this.updateBeatsEvent.emit({ beats: beats, isFinished: this.isDmoFinised, beatIdToFocus: this.beatsIds[beatIdToFocus] });
    this.updatePlotPoints();
  }

  private updatePlotPoints() {
    let newPlotPoints = []
    this.beatsIds.forEach((beatId, i) => {
      newPlotPoints.push({beatId: beatId, plotPointMetaData: this.beatsMetaData[i], order: i});
    });

    this.updateGraphEvent.emit({newplotPoints: newPlotPoints, isFinished: this.isDmoFinised});
  }

 // ------- [end] CRUD



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

  private buildDto() {
    let dmo = new NnaDmoDto();
    
    let time1 = new NnaBeatTimeDto();
    time1.hours = 0;
    time1.minutes = 9;
    time1.seconds = 13;

    let time2 = new NnaBeatTimeDto();
    time2.hours = 1;
    time2.minutes = 18;
    time2.seconds = 10;

    let beat1 = new NnaBeatDto();
    beat1.beatId = "5164A99B-2C5C-4081-95AC-14F5237E1473";
    beat1.order = 0;
    beat1.text = "second eat detailssomeme beat details soails  ome ome beat detailssome beat detai";
    beat1.time = time1;

    let beat2 = new NnaBeatDto();
    beat2.beatId = "5164A99B-2C5C-4081-95AC-14F5237E9023";
    beat2.order = 1;
    beat2.text = "some beat details some beat details some beat details some beat details some beat details some beat detailssome beat details some beat details some beat details some beat detailssome beat details some beat detailssome beat details some beat details some beat detailssome beat detailssome beat details  some beat detailssome beat details  ome beat details some beat details some beat detailssome beat detai some beat detailssome beat details  ome beat details some beat details some beat detailssome beat detai";
    // beat2.time = time2;
    
    let beats : NnaBeatDto[] = [];
    beats.push(beat1);
    beats.push(beat2);

    dmo.dmoId = "5164A99B-2C5C-4081-95AC-14F5237E1341";
    dmo.isFinished = false;
    dmo.statusString = "some status";
    dmo.beats = beats
    return dmo;
  }

    // addBeat() {
  //   let beatsData: any[] = [];
  //   this.selectPlotPointsIds().forEach((beatId, i) => {
  //     beatsData.push({beatId: beatId, lineCount: 2, order: i}); // calculate lineCount here
  //   });

  //   beatsData.push({beatId: 'c3f27580-c727-4513-810b-3d595bc08956', lineCount: 1, order: 2});//generate plot point id
  //   this.updateGraphEvent.emit({newplotPoints: beatsData, isFinished: false, graphHeigth: 300});
  // }

  // removeBeat() {
  //   let beatsData: any[] = [];
  //   this.selectPlotPointsIds().forEach((beatId, i) => {
  //     beatsData.push({beatId: beatId, lineCount: 2, order: i}); // calculate lineCount here
  //   });

  //   beatsData.pop()
  //   this.updateGraphEvent.emit({newplotPoints: beatsData, isFinished: false, graphHeigth: 300});
  // }

  // private updateBeats(change: any, changeType: ChangeType) {    
  //   let copiedBeats = this.copyBeats(this.currentDmo.beats);

  //   switch (changeType) { 
  //     case ChangeType.plotPointTimeChanged: {
  //       copiedBeats.forEach(beat => {
  //         if (beat.beatId == change.beatId) {
  //           beat.plotPoint = change.plotPoint;
  //         }
  //         return beat;
  //       });
  //       this.updateCurrDmo(copiedBeats);
  //       break;
  //     } case ChangeType.lineCountChanged: {
  //       copiedBeats.forEach(beat => {
  //         if (beat.beatId == change.beatData.beatId) {
  //           beat.lineCount = change.newLineCount;
  //         }
  //         return beat;
  //       });
  //       this.updateCurrDmo(copiedBeats);
  //       break;
  //     } case ChangeType.beatAdded: {
  //       let newBeat = this.dataGenerator.createBeatWithDefaultData();
  //       let newOrder = change.currentBeat.order + 1;
  //       newBeat.order = newOrder;
  
  //       copiedBeats.splice(change.currentBeat.order, 0, newBeat);
  //       copiedBeats.forEach((item, index) => {
  //         if (index > change.currentBeat.order) {
  //           item.order =  item.order + 1;
  //         }
  //       });
  //       this.updateCurrDmo(copiedBeats);
  //       break;
  //     } case ChangeType.beatRemoved: {
  //       copiedBeats.splice(change.order - 1, 1);
  //       copiedBeats.forEach((item, index) => {
  //         if (index >= change.order - 1) {
  //           item.order =  item.order - 1;
  //         }
  //       }); 
  //       this.updateCurrDmo(copiedBeats);
  //       break;
  //     } case ChangeType.beatTextChanged: {
  //       copiedBeats.forEach((beat: BeatDto) => {
  //         let changedBeat = change.find(b => b.beatId == beat.beatId);
  //         if (changedBeat != undefined) {          
  //           beat.beatText = changedBeat.data;
  //           return beat;
  //         }
  //         return beat;
  //       });
  //       this.updateCurrDmo(copiedBeats);
  //       break;
  //     } default: { return; }
  //   }

  //   this.beatsToSend = this.copyBeats(copiedBeats);
  //   this.editorChangeDetectorService.detect(changeType);
  // }

  // private updateCurrDmo(beats: BeatDto[]) {
  //   this.currentDmo.beats = this.copyBeats(beats);
  // }

  // private copyBeats(beats: BeatDto[]) {
  //   return JSON.parse(JSON.stringify(beats, this.selectBeats), this.selectBeatsFromString);
  // }

  // private selectBeats = (key, value) => {
  //   return key == "plotPoint"
  //     ? { hour: value.hour.value, minutes: value.minutes.value, seconds: value.seconds.value }
  //     : value;
  // };

  // private selectBeatsFromString = (key, value) => {
  //   return key == "plotPoint"
  //     ? new PlotPointDto().setAndGetTime(value.hour, value.minutes, value.seconds)
  //     : value;
  // };

  // private buildDmoWithBeatsJson() : DmoDtoAsJson {
  //   let dmoWithJson : DmoDtoAsJson = new DmoDtoAsJson(); 
  //   dmoWithJson.json = JSON.stringify(this.beatsToSend, this.selectBeats);
  //   dmoWithJson.dmoId = this.dmoId;
  //   return dmoWithJson;
  // }

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

  
  // lineCountChanged($event: any) {
  //   this.updateBeats($event, ChangeType.lineCountChanged);
  //   this.reRenderPlotFlowEvent.emit();
  // }

  // beatsTextChanged($event: any) { 
  //   this.updateBeats($event, ChangeType.beatTextChanged);
  // }

  // focusCurrentBeatFromPicker($event: any) {
  //   this.focusBeatEvent.emit($event.beat)
  // }

  // plotTimeChanged($event: any) {
  //   if (!$event.noChanges) {
  //     this.updateBeats($event.beat, ChangeType.plotPointTimeChanged);
  //   }
  
  //   if ($event.focusBeat) {
  //     this.focusBeatEvent.emit($event.beat)
  //   }
  // }
  
  // beatAdded($event) {
  //   this.updateBeats($event, ChangeType.beatAdded);
  //   this.reRenderPlotFlowEvent.emit({fromBeat: $event.currentBeat.beatId});
  // }

  // beatRemoved($event) {
  //   this.updateBeats($event, ChangeType.beatRemoved);
  //   this.reRenderPlotFlowEvent.emit();
  // }

  // focusTimePicker($event) {
  //   this.focusTimpePickerEvent.emit($event.beatId);
  // }

}
