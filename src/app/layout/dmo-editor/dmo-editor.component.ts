import { DmoDto, CreateDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

import { EditorHub } from './services/editor-hub.sercice';

import { Toastr } from '../../shared/services/toastr.service';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dmo-editor',
  templateUrl: './dmo-editor.component.html',
  styleUrls: ['./dmo-editor.component.scss']
})
export class DmoEditorComponent implements OnInit, OnDestroy {
  @ViewChild('dmobit', { static: true }) dmobit: ElementRef;
  dmoId: string;
  isConnected = false;
  isDmoInfoSet = false;
  isInitialPopupOpen = false;
  initialPopup: MatDialogRef<InitialPopupComponent>;
  currentDmo: DmoDto;

  constructor(
    private editorHub: EditorHub,
    private dmosService: DmosService,
    private activatedRoute: ActivatedRoute,
    private toastr: Toastr,
    public matModule: MatDialog) { }

  async ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.dmoId = params['dmoId'];
    });
    if (this.dmoId) {
      await this.connect();
      this.editorHub.loadDmo(this.dmoId);
      this.isDmoInfoSet = true;
    } else {
      await this.finalizePopup();
      if (this.isDmoInfoSet) {
        await this.openConnection();
      }
    }
  }

  async setDmoInfo() {
    await this.finalizePopup();
    if (this.isDmoInfoSet) {
      await this.openConnection();
    }
  }

  async editDmoInfo() {
    const popupData = {
      dmoName: this.currentDmo.name,
      movieTitle: this.currentDmo.movieTitle,
      shortComment: this.currentDmo.shortComment
    };

    await this.finalizePopup(popupData);
  }

  async ngOnDestroy() {
    await this.disconnect();
    this.dmoId = '';
    this.isDmoInfoSet = false;
    this.initialPopup.close();
  }

  async connect() {
    await this.editorHub.startConnection();
    this.isConnected = true;
  }

  async disconnect() {
    await this.editorHub.abortConnection();
    this.isConnected = false;
  }

  async closeEditor() {
    await this.disconnect();
    this.isDmoInfoSet = false;
    this.currentDmo = null;
    this.matModule.closeAll();
    this.initialPopup = null;
  }

  async onEnter() {
  //   const update1: ShortDmoWithBeatsDto = {
  //     id: '1c1b7d62-6a1a-4f0a-9691-2418c1e01111',
  //     beats: [
  //     {
  //       id: '',
  //       description: 'first beat',
  //       order: 1,
  //       plotTimeSpot: {hours: 0, minutes: 5 }
  //     },
  //     {
  //       id: '',
  //       description: 'second beat',
  //       order: 2,
  //       plotTimeSpot: {hours: 0, minutes: 8 }
  //     }
  //   ]
  // };

  //this.editorHub.partiallyUpdateDmo(update1);
  }

  private async finalizePopup(popupData: any = null) {
    this.initialPopup = this.matModule.open(InitialPopupComponent, {
      data: popupData,
      width: '400px' });
    this.isInitialPopupOpen = true;

    await this.setInitialData();
  }

  private async openConnection() {
    await this.connect();
    //await this.editorHub.createDmo(createDto); //load dmo
    //let result = await this.editorHub.loadDmo('1c1b7d62-6a1a-4f0a-9691-2418c1e01111');
  }

  private async setInitialData() {
    const dmoinfo = await this.initialPopup.afterClosed().toPromise();
    this.isInitialPopupOpen = false;
    if (!dmoinfo) {
      this.isDmoInfoSet = false;
    } else {
      this.currentDmo = new DmoDto();
      this.currentDmo.name = dmoinfo.dmoName;
      this.currentDmo.movieTitle = dmoinfo.movieTitle;
      this.currentDmo.shortComment = dmoinfo.shortComment;
      this.isDmoInfoSet = true;
    }
  }

}
