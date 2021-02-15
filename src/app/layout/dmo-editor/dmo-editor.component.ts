import { ShortDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { EditorHub } from './services/editor-hub.service';

import { Toastr } from '../../shared/services/toastr.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { ToastrErrorMessage } from 'src/app/shared/models/serverResponse';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';
import { DmoDto, DmoDtoAsJson, PlotPointDto } from './models/editorDtos';
import { EventEmitter } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { EditorChangeDetectorService } from './helpers/editor-change-detector';
import { ChangeType } from './models/changeTypes';
import { BeatGeneratorService } from './helpers/beat-generator';




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
  currentDmo: DmoDto;

  // events
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
    private editorChangeDetectorService: EditorChangeDetectorService,
    private dataGenerator: BeatGeneratorService) {
      this.beatsUpdating = false; 
      this.finishDmoEvent = new EventEmitter<void>();
      this.reRenderPlotFlowEvent = new EventEmitter<void>();
    }

  async ngOnInit() {
    this.isDmoInfoSet = false;
    this.isInitialPopupOpen = false;
    this.beatsLoading = true;

    this.editorChangeDetectorService.detector.subscribe(async (updates: Array<string>) => {
      this.beatsUpdating = true;
      await this.editorHub.updateDmosJson(this.buildDmoWithBeatsJson());
      this.beatsUpdating = false;

      console.log('==================');
      console.log('beats were updated');
      console.log(updates);
      console.log(this.currentDmo);

      
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
  
  beatAdded($event) {
    this.updateBeats($event, ChangeType.beatAdded);
    this.reRenderPlotFlowEvent.emit();
  }

  beatRemoved($event) {
    this.updateBeats($event, ChangeType.beatRemoved);
    this.reRenderPlotFlowEvent.emit();
  }

  finishDmo() {
    this.currentDmo.isFinished = !this.currentDmo.isFinished;
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

      if (this.currentShortDmo.hasBeats) {
        this.loadBeats();
      } else {
        this.currentDmo.beats = [];
        this.currentDmo.beats.push(this.dataGenerator.createBeatWithDefaultData());
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
    if(this.currentShortDmo && this.currentShortDmo.id) {
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
    this.currentDmo = new DmoDto();

    if(result.id) {
      this.currentShortDmo.id = result.id;
      this.dmoId = result.id;
      this.currentDmo.dmoId = result.id;
    }
    this.currentShortDmo.shortComment = result.shortComment;
    this.currentShortDmo.hasBeats = result.hasBeats;
    this.currentDmo.beats = [];

    this.isDmoInfoSet = true;
  }

  private loadBeats() {
    let $initialLoad = this.editorHub.initialBeatsLoad(this.dmoId)
      .pipe(takeUntil(this.unsubscribe$));
      
    $initialLoad.subscribe({
      next: (result: any) => { 
        let beats = Object.assign([], JSON.parse(result.beatsJson, (key, value) => {
          return key == "plotPoint"
            ? new PlotPointDto().setAndGetTime(value.hour, value.minutes, value.seconds)
            : value;
        }));

        this.currentDmo.dmoId = result.dmoId;
        this.currentDmo.beats = beats;
        this.currentDmo.isFinished = result.dmoStatusId == 1; //Completed
        this.currentDmo.statusString = result.dmoStatus;
        this.beatsLoading = false;
      },
      error: (err) => { this.toastr.error(err); }
    });
  }

  private updateBeats(change: any, changeType: ChangeType) {
    let copiedBeats = [ ...this.currentDmo.beats ];
    
    if (changeType == ChangeType.none) {
      return;
    } else if (changeType == ChangeType.plotPointTimeChanged) {
      copiedBeats = this.currentDmo.beats.map(beat => {
        if (beat.beatId == change.beatId) {
          beat.plotPoint = change.plotPoint;
        }
        return beat;
      });
      this.editorChangeDetectorService.detect(ChangeType.plotPointTimeChanged);
    } else if (changeType == ChangeType.lineCountChanged) {
      copiedBeats = this.currentDmo.beats.map(beat => {
        if (beat.beatId == change.beatData.beatId) {
          beat.lineCount = change.newLineCount;
        }
        return beat;
      });

      copiedBeats = this.currentDmo.beats.map(beat => {
        if (beat.beatId == change.beatData.beatId) {
          beat.lineCount = change.newLineCount;
        }
        return beat;
      });
      this.editorChangeDetectorService.detect(ChangeType.lineCountChanged);
    } else if (changeType == ChangeType.beatTextChanged) {
      copiedBeats = this.currentDmo.beats.map(beat => {
        let changedBeat = change.find(b => b.beatId == beat.beatId);
        if (changedBeat != undefined) {
          beat.beatText = changedBeat.data;
        }
        return beat;
      });
      this.editorChangeDetectorService.detect(ChangeType.beatTextChanged);
    } else if (changeType == ChangeType.beatAdded) {
      let newBeat = this.dataGenerator.createBeatWithDefaultData();
      let newOrder = change.currentBeat.order + 1;
      newBeat.order = newOrder;

      copiedBeats.splice(change.currentBeat.order, 0, newBeat);

      copiedBeats.forEach((item, index) => {
        if (index > change.currentBeat.order) {
          item.order =  item.order + 1;
        }
      }); 

      this.editorChangeDetectorService.detect(ChangeType.beatAdded);
    } else if (changeType == ChangeType.beatRemoved) {
      copiedBeats.splice(change.order - 1, 1);

      copiedBeats.forEach((item, index) => {
        if (index >= change.order - 1) {
          item.order =  item.order - 1;
        }
      }); 

      this.editorChangeDetectorService.detect(ChangeType.beatRemoved);
    }

    this.currentDmo.beats = [ ...copiedBeats ];
  }

  private buildDmoWithBeatsJson() : DmoDtoAsJson {
    let dmoWithJson : DmoDtoAsJson = new DmoDtoAsJson(); 
    dmoWithJson.json = JSON.stringify(this.currentDmo.beats, (key, value) => {
      return key == "plotPoint"
        ? { hour: value.hour.value, minutes: value.minutes.value, seconds: value.seconds.value }
        : value;
    });
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

}
