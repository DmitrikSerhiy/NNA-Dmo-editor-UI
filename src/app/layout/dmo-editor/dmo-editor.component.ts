import { ShortDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { EditorHub } from './services/editor-hub.sercice';

import { Toastr } from '../../shared/services/toastr.service';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { ToastrErrorMessage } from 'src/app/shared/models/serverResponse';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';
import { BeatDetailsDto, TimeDto, PlotFlowDto, PlotPointDto } from './models/editorDtos';
import { EventEmitter } from '@angular/core';


@Component({
  selector: 'app-dmo-editor',
  templateUrl: './dmo-editor.component.html',
  styleUrls: ['./dmo-editor.component.scss']
})
export class DmoEditorComponent implements OnInit, OnDestroy {
  @ViewChild('dmobit', { static: true }) dmobit: ElementRef;
  dmoId: string;
  isDmoInfoSet: boolean;
  isInitialPopupOpen: boolean;
  initialPopup: MatDialogRef<InitialPopupComponent>;
  currentDmo: ShortDmoDto;
  beats: any[];
  plotFlow: PlotFlowDto;
  beatsData: BeatDetailsDto[];

  addBeatEvent: EventEmitter<void>;
  removeBeatEvent: EventEmitter<void>;
  finishDmoEvent: EventEmitter<void>;
  reRenderPlotFlowEvent: EventEmitter<void>;

  constructor(
    private editorHub: EditorHub,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: Toastr,
    public matModule: MatDialog,
    private sidebarManagerService: SidebarManagerService) { }

  async ngOnInit() {
    this.createAndInitDmo();
    // this.isDmoInfoSet = false;
    // this.isInitialPopupOpen = false;
    // this.activatedRoute.queryParams.subscribe(params => {
    //   this.dmoId = params['dmoId'];
    // });
    // if (this.dmoId) {
    //   await this.loadDmo();
    // } else {
    //   await this.createAndInitDmo();
    // }
  }

  async ngOnDestroy() {
    await this.closeEditorAndClearData();
  }


  lineIncremented($event: BeatDetailsDto) {
    this.plotFlow.plotPoints = this.plotFlow.plotPoints.map(plotPoint => {
      if (plotPoint.id == $event.id) {
        plotPoint.lineCount = plotPoint.lineCount + 1;
      }
      return plotPoint;
    });

    this.beatsData = this.beatsData.map(beat => {
      if (beat.id == $event.id) {
        beat.lineCount = beat.lineCount + 1;
      }
      return beat;
    });
    this.reRenderPlotFlowEvent.emit();
  }

  lineDecremented($event: BeatDetailsDto) {
    this.plotFlow.plotPoints = this.plotFlow.plotPoints.map(plotPoint => {
      if (plotPoint.id == $event.id) {
        plotPoint.lineCount = plotPoint.lineCount - 1;
      }
      return plotPoint;
    });

    this.beatsData = this.beatsData.map(beat => {
      if (beat.id == $event.id) {
        beat.lineCount = beat.lineCount - 1;
      }
      return beat;
    });
    this.reRenderPlotFlowEvent.emit();
  }
  
  addBeat() {
    let point7 = new PlotPointDto();
    point7.order = 7;
    point7.id = 'some id 7';
    point7.time =  new TimeDto().setAndGetTime('4', '15', '00');
    point7.lineCount = 1;

    this.plotFlow.plotPoints.push(point7);
    this.addBeatEvent.emit();
  }

  removeBeat() {
    this.plotFlow.plotPoints.pop();
    this.removeBeatEvent.emit();
  }

  finishDmo() {
    this.plotFlow.isFinished = !this.plotFlow.isFinished;
    this.finishDmoEvent.emit();
  }

  
  //this is async method
  async createAndInitDmo() {
    this.addBeatEvent = new EventEmitter<void>();
    this.removeBeatEvent = new EventEmitter<void>();
    this.finishDmoEvent = new EventEmitter<void>();
    this.reRenderPlotFlowEvent = new EventEmitter<void>();

    let tempDmo = new ShortDmoDto('test name', 'test movie');
    tempDmo.id = 'some id';
    tempDmo.shortComment = 'some comment';
    this.initDmo(tempDmo);
    this.plotFlow = new PlotFlowDto();
    this.setPlotPointsAndBeats();
    this.plotFlow.isFinished = true;
    this.isDmoInfoSet = true;



    // const popupResult = await this.finalizePopup();
    // if (!popupResult) {
    //   return;
    // }
    // await this.editorHub.startConnection();
    
    // let response: EditorResponseDto;
    // try {
    //   response = await this.editorHub.createDmo(popupResult);
    // } catch (err) {
    //   this.showUnhandledException(err);
    //   return;
    // }

    // if (this.handleResponse(response)) {
    //   this.initDmo(response.data);
    //   this.sidebarManagerService.collapseSidebar();
    // }
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

  setPlotPointsAndBeats(): void {
    let point1 = new PlotPointDto();
    point1.order = 1; //start from 1!!!
    point1.id = 'dmoId_BeatId_PlotPointId1';
    point1.time = new TimeDto().setAndGetTime('0', '05', '10');
    point1.lineCount = 1;

    let point2 = new PlotPointDto();
    point2.order = 2;
    point2.id = 'dmoId_BeatId_PlotPointId2';
    point2.time =  new TimeDto().setAndGetTime('0', '07', '22');
    point2.lineCount = 1;

    let point3 = new PlotPointDto(); 
    point3.order = 3;
    point3.id = 'dmoId_BeatId_PlotPointId3';
    point3.time = new TimeDto().setAndGetTime('1', '12', '15');
    point3.lineCount = 1;

    // let point4 = new TimeFlowPointDto(); 
    // point4.order = 4;
    // point4.id = 'some id 4';
    // point4.time = new TimeDto().setAndGetTime('2', '56', '00');
    // point4.lineCount = 1;

    // let point5 = new TimeFlowPointDto(); 
    // point5.order = 5;
    // point5.id = 'some id 5';
    // point5.time = new TimeDto().setAndGetTime('3', '32', '44');
    // point5.lineCount = 1;

    // let point6 = new TimeFlowPointDto(); 
    // point6.order = 6;
    // point6.id = 'some id 6';
    // point6.time = new TimeDto().setAndGetTime('3', '54', '36');
    // point6.lineCount = 1;
    
    this.plotFlow.plotPoints = [];
    this.plotFlow.plotPoints.push(point1, point2, point3);//, point4, point5, point6);

    let details1 = new BeatDetailsDto();
    details1.id = "dmoId_BeatId_PlotPointId1";
    details1.lineCount = 1;
    details1.text = 'Lorem Ipsum is simply dummy text of the  Lorem Ipsum has been the indust';

    let details2 = new BeatDetailsDto();
    details2.id = "dmoId_BeatId_PlotPointId2";
    details2.lineCount = 1;
    details2.text = 'text of the  Lorem Ipsum has been the industrys standard dummy';

    let details3 = new BeatDetailsDto();
    details3.id = "dmoId_BeatId_PlotPointId3";
    details3.lineCount = 1;
    details3.text = 'has been the industrys standard dummy';

    this.beatsData = [];
    this.beatsData.push(details1, details2, details3);
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
    this.isDmoInfoSet = true;
  }

  private async closeEditorAndClearData() {
    await this.editorHub.abortConnection();
    this.dmoId = '';
    this.isDmoInfoSet = false;
    this.isInitialPopupOpen = false;
    this.matModule.closeAll();
    this.initialPopup = null;
    this.currentDmo = null;
  }

}
