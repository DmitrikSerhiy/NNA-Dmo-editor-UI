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
  initialPopup: any;
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
      this.connect().then(r => this.editorHub.loadDmo(this.dmoId));
    } else {
      await this.finalizePopupAndOpenConnection();
    }
  }

  async newDmo() {
    await this.finalizePopupAndOpenConnection();
  }

  async ngOnDestroy() {
    await this.disconnect();
  }

  async connect() {
    await this.editorHub.startConnection();
    this.isConnected = true;
  }

  async disconnect() {
    await this.editorHub.abortConnection();
    this.isConnected = false;
  }

  onEnter() {
    let text = this.dmobit.nativeElement.value;
    console.log(text);

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

  private async finalizePopupAndOpenConnection() {
    this.initialPopup = this.matModule.open(InitialPopupComponent);
    if (await this.setInitialData()) {
      const createDto: CreateDmoDto = {
        name: this.currentDmo.name,
        movieTitle: this.currentDmo.movieTitle,
        mark: this.currentDmo.mark,
        shortComment: this.currentDmo.shortComment
      };

      await this.connect();
      await this.editorHub.createDmo(createDto);//load dmo
    }
  }

  private async setInitialData() {
    const result = await this.initialPopup.afterClosed().toPromise();
    if (!result) {
      return false;
    } else {
      this.currentDmo = new DmoDto(result.dmoName, result.dmoMovieTitle);
      return true;
    }
  }

}
