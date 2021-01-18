import { ShortDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { EditorHub } from './services/editor-hub.sercice';

import { Toastr } from '../../shared/services/toastr.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { ToastrErrorMessage } from 'src/app/shared/models/serverResponse';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';
import { BeatDetailsDto, TimeDto, PlotFlowDto, BeatsDto, DmoWithJson } from './models/editorDtos';
import { EventEmitter } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
  import { Subject } from 'rxjs';
import { EditorChangeDetectorService } from './services/editor-change-detector.service';
import { ChangeType } from './models/changeTypes';


@Component({
  selector: 'app-dmo-editor',
  templateUrl: './dmo-editor.component.html',
  styleUrls: ['./dmo-editor.component.scss']
})
export class DmoEditorComponent implements OnInit, OnDestroy {

  isInitialPopupOpen: boolean;
  initialPopup: MatDialogRef<InitialPopupComponent>;
  
  // main fields
  isDmoInfoSet: boolean;
  beatsLoading: boolean;
  dmoId: string;
  currentDmo: ShortDmoDto;
  plotFlow: PlotFlowDto;
  beatsData: BeatDetailsDto[];

  // events
  addBeatEvent: EventEmitter<void>;
  removeBeatEvent: EventEmitter<void>;
  finishDmoEvent: EventEmitter<void>;
  reRenderPlotFlowEvent: EventEmitter<void>;

  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private editorHub: EditorHub,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: Toastr,
    public matModule: MatDialog,
    private sidebarManagerService: SidebarManagerService,
    private editorChangeDetectorService: EditorChangeDetectorService) { 
      this.addBeatEvent = new EventEmitter<void>();
      this.removeBeatEvent = new EventEmitter<void>();  
      this.finishDmoEvent = new EventEmitter<void>();
      this.reRenderPlotFlowEvent = new EventEmitter<void>();
    }

  async ngOnInit() {
    this.isDmoInfoSet = false;
    this.isInitialPopupOpen = false;
    this.beatsLoading = true;

    this.editorChangeDetectorService.detector.subscribe(async (updates: Array<any>) => {
      console.log(updates);
      await this.editorHub.updateDmosJson(this.buildDmoWithBeatsJson())
      // let converted = this.buildDmoWithBeatsJson();
      // console.log(converted);
      
      // console.log(updates);
      // console.log(this.plotFlow);
      // console.log(this.beatsData);
    });

    this.activatedRoute.queryParams.subscribe(params => {
      this.dmoId = params['dmoId'];
    });

    if (this.dmoId) {
      await this.loadDmo();
    } else {
      await this.createAndInitDmo();
    }
  }

  async ngOnDestroy() {
    await this.closeEditorAndClearData();
  }


  lineCountChanged($event: any) {
    this.updateBeats($event, ChangeType.lineCountChanged);
    this.reRenderPlotFlowEvent.emit();
  }

  beatsTextChanged($event: any) { 
    this.updateBeats($event, ChangeType.beatTextChanged);
  }

  plotTimeChanged($event: any) {
    this.updateBeats($event, ChangeType.plotPointTimeChanged);
  }
  
  addBeat() {
    this.addBeatEvent.emit();
  }

  removeBeat() {
    this.removeBeatEvent.emit();
  }

  finishDmo() {
    this.plotFlow.isFinished = !this.plotFlow.isFinished;
    this.finishDmoEvent.emit();
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

      if (this.currentDmo.hasBeats) {
        this.loadBeats();
      } else {
        this.beatsLoading = false;
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
    if(this.currentDmo) {
      popupData = this.currentDmo;
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
    if(this.currentDmo && this.currentDmo.id) {
      response.id = this.currentDmo.id;
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
    this.currentDmo = new ShortDmoDto(result.name, result.movieTitle);

    if(result.id) {
      this.currentDmo.id = result.id;
      this.dmoId = result.id;
    }
    this.currentDmo.shortComment = result.shortComment;
    this.currentDmo.hasBeats = result.hasBeats;
    this.isDmoInfoSet = true;
  }

  private loadBeats() {
    let $initialLoad = this.editorHub.initialBeatsLoad(this.dmoId)
      .pipe(takeUntil(this.unsubscribe$));
      
    $initialLoad.subscribe({
      next: (result: any) => { 
        let beats: BeatsDto = Object.assign(new BeatsDto(), JSON.parse(result.beatsJson, (key, value) => {
          return key == "time"
            ? new TimeDto().setAndGetTime(value.hour, value.minutes, value.seconds)
            : value;
        }));
        this.plotFlow = beats.plotFlowDto;
        this.beatsData = beats.beatDetails;
        this.beatsLoading = false;
      },
      error: (err) => { this.toastr.error(err); }
    });
  }

  private updateBeats(change: any, changeType: ChangeType) {
    let beatsJson = new BeatsDto();
    beatsJson.beatDetails = [ ...this.beatsData ];
    beatsJson.plotFlowDto = { ...this.plotFlow };
    
    if (changeType == ChangeType.none) {
      return;
    } else if (changeType == ChangeType.plotPointTimeChanged) {
      beatsJson.plotFlowDto.plotPoints = this.plotFlow.plotPoints.map(plotPoint => {
        if (plotPoint.id == change.id) {
          plotPoint.time = change.time;
        }
        return plotPoint;
      });
      this.editorChangeDetectorService.detect(ChangeType.plotPointTimeChanged);
    } else if (changeType == ChangeType.lineCountChanged) {
      beatsJson.plotFlowDto.plotPoints = this.plotFlow.plotPoints.map(plotPoint => {
        if (plotPoint.id == change.beatData.id) {
          plotPoint.lineCount = change.newLineCount;
        }
        return plotPoint;
      });

      beatsJson.beatDetails = this.beatsData.map(beat => {
        if (beat.id == change.beatData.id) {
          beat.lineCount = change.newLineCount;
        }
        return beat;
      });
      this.editorChangeDetectorService.detect(ChangeType.lineCountChanged);
    }  else if (changeType == ChangeType.beatTextChanged) {
      beatsJson.beatDetails = this.beatsData.map(beat => {
        let changedBeat = change.find(b => b.beatId == beat.id);
        if (changedBeat) {
          beat.text = changedBeat.data;
        }
        return beat;
      });
      this.editorChangeDetectorService.detect(ChangeType.beatTextChanged);
    }

    this.beatsData = [...beatsJson.beatDetails];
    this.plotFlow = { ...beatsJson.plotFlowDto };
  }

  private buildDmoWithBeatsJson() : DmoWithJson {
    let beatsDto : BeatsDto = new BeatsDto();
    beatsDto.beatDetails = this.beatsData;
    beatsDto.plotFlowDto = this.plotFlow;
    
    let dmoWithJson : DmoWithJson = new DmoWithJson(); 
    dmoWithJson.json = JSON.stringify(beatsDto, (key, value) => {
      return key == "time"
        ? { hour: value.hour.value, minutes: value.minutes.value, seconds: value.seconds.value }
        : value;
    });
    dmoWithJson.beatId = this.dmoId;
    return dmoWithJson;
  }


  private async closeEditorAndClearData() {
    await this.editorHub.abortConnection();
    this.dmoId = '';
    this.isDmoInfoSet = false;
    this.isInitialPopupOpen = false;
    this.matModule.closeAll();
    this.initialPopup = null;
    this.currentDmo = null;

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
