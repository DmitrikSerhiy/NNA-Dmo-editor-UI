import { ShortDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { EditorHub } from './services/editor-hub.service';

import { Toastr } from '../../shared/services/toastr.service';
import { Component, OnInit, OnDestroy, ElementRef, QueryList } from '@angular/core';
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
  
  // main fields
  isDmoInfoSet: boolean;
  beatsLoading: boolean;
  dmoId: string;
  currentShortDmo: ShortDmoDto;
  initialDmoDto: NnaDmoDto;
  //currentDmo: DmoDto;
  //beatsToSend: BeatDto[];

  // events
  updateGraphEvent: EventEmitter<any>;
  // finishDmoEvent: EventEmitter<void>;
  // reRenderPlotFlowEvent: EventEmitter<any>;
  // focusBeatEvent: EventEmitter<any>;
  // focusTimpePickerEvent: EventEmitter<any>;

  //private shouldSyncCurrDmo: boolean;

  private plotPointsData: any;
  private beatsData: any;

  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private editorHub: EditorHub,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: Toastr,
    public matModule: MatDialog,
    private sidebarManagerService: SidebarManagerService,
    // private editorChangeDetectorService: EditorChangeDetectorService,
    //private dataGenerator: BeatGeneratorService
    ) {
      this.beatsUpdating = false; 
      this.updateGraphEvent = new EventEmitter<any>();
      // this.finishDmoEvent = new EventEmitter<void>();
      // this.reRenderPlotFlowEvent = new EventEmitter<any>();
      // this.focusBeatEvent = new EventEmitter<any>();
      // this.focusTimpePickerEvent = new EventEmitter<any>();
    }

  async ngOnInit() {
    this.isDmoInfoSet = false;
    this.isInitialPopupOpen = false;
    this.beatsLoading = true;

    this.initialDmoDto = this.buildDto();
    this.beatsLoading = false;
    this.isDmoInfoSet = true;

    //this.editorChangeDetectorService.detector.subscribe(async (updates: Array<string>) => {
      // this.beatsUpdating = true;
      // await this.editorHub.updateDmosJson(this.buildDmoWithBeatsJson());
      // this.beatsToSend = [];
      // this.beatsUpdating = false;

      // console.log('==================');
      // console.log('beats were updated');
      // console.log(updates);
      // console.log(this.currentDmo.beats);

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

  // finishDmo() {
  //   this.currentDmo.isFinished = !this.currentDmo.isFinished;
  //   this.finishDmoEvent.emit();
  // }

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

  beatsSet(beats) {
    this.beatsData = beats;
  }

  plotPointsSet(plotPoints) {
    this.plotPointsData = plotPoints;
  }

  selectPlotPointsIds() {
    let plotPointSufix = 'plot_point_';
    return this.plotPointsData.elements.map(b => b.nativeElement.firstChild.getAttribute('id').substring(plotPointSufix.length));
  }

  private buildDto() {
    let dmo = new NnaDmoDto();
    
    let time1 = new NnaBeatTimeDto();
    time1.hours = 0;
    time1.minutes = 13;
    time1.seconds = 25;

    let time2 = new NnaBeatTimeDto();
    time2.hours = 0;
    time2.minutes = 15;
    time2.seconds = 40;

    let beat1 = new NnaBeatDto();
    beat1.beatId = "5164A99B-2C5C-4081-95AC-14F5237E1473";
    beat1.order = 0;
    beat1.text = "some beat details";
    beat1.time = time1;

    let beat2 = new NnaBeatDto();
    beat2.beatId = "5164A99B-2C5C-4081-95AC-14F5237E9023";
    beat2.order = 1;
    beat2.text = "second beat details";
    beat2.time = time2;
    
    let beats : NnaBeatDto[] = [];
    beats.push(beat1);
    beats.push(beat2);

    dmo.dmoId = "5164A99B-2C5C-4081-95AC-14F5237E1341";
    dmo.isFinished = false;
    dmo.statusString = "some status";
    dmo.beats = beats
    return dmo;
  }



  addBeat() {
    let beatsData: any[] = [];
    this.selectPlotPointsIds().forEach((beatId, i) => {
      beatsData.push({beatId: beatId, lineCount: 2, order: i}); // calculate lineCount here
    });

    beatsData.push({beatId: 'c3f27580-c727-4513-810b-3d595bc08956', lineCount: 1, order: 2});//generate plot point id
    this.updateGraphEvent.emit({newplotPoints: beatsData, isFinished: false, graphHeigth: 300});
  }

  removeBeat() {
    let beatsData: any[] = [];
    this.selectPlotPointsIds().forEach((beatId, i) => {
      beatsData.push({beatId: beatId, lineCount: 2, order: i}); // calculate lineCount here
    });

    beatsData.pop()
    this.updateGraphEvent.emit({newplotPoints: beatsData, isFinished: false, graphHeigth: 300});
  }
  
  finishDmo() {
    let beatsData: any[] = [];
    this.selectPlotPointsIds().forEach((beatId, i) => {
      beatsData.push({beatId: beatId, lineCount: 2, order: i}); // calculate lineCount here
    });

    this.updateGraphEvent.emit({newplotPoints: beatsData, isFinished: true, graphHeigth: 300});
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

    this.initialDmoDto.beats.map(b=> b.beatId).forEach((beatId, i) => {
      plotPointsData.push({beatId: beatId, lineCount: 2, order: i}); // calculate lineCount here
    });

    return plotPointsData;
  }

  calculatePlotPointsGraphHeigth() {
    return 300;
  }

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
  //   console.log(`${changeType} added to array`);
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

}
