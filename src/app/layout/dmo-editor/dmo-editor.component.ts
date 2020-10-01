import { DmoDto, CreateDmoDto, EditDmoInfoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

import { EditorHub } from './services/editor-hub.sercice';

import { Toastr } from '../../shared/services/toastr.service';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';

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
    public matModule: MatDialog,
    private sidebarManagerService: SidebarManagerService) { }

  async ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.dmoId = params['dmoId'];
    });
    if (this.dmoId) {
      await this.connect();
      await this.setLoadedData();
      this.isDmoInfoSet = true;
    } else {
      const result = await this.finalizePopup();
      if (this.isDmoInfoSet && result) {
        await this.openConnection();
        await this.createDmo();
      }
    }
    this.sidebarManagerService.collapseSidebar();
  }

  async setDmoInfo() {
    const result = await this.finalizePopup();
    if (this.isDmoInfoSet && result) {
      await this.openConnection();
      await this.createDmo();
    }
  }

  async editDmoInfo() {
    const popupData = !this.currentDmo ? null : {
      dmoName: this.currentDmo.name,
      movieTitle: this.currentDmo.movieTitle,
      shortComment: this.currentDmo.shortComment
    };

    const result = await this.finalizePopup(popupData);
    if (result) {
      await this.setEditedData();
    }
  }

  async ngOnDestroy() {
    await this.disconnect();
    this.dmoId = '';
    this.isDmoInfoSet = false;
    this.matModule.closeAll();
    this.initialPopup = null;
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
    // some stuff
  }



  private async createDmo() {
    const result = await this.editorHub.createDmo(new CreateDmoDto(
      this.currentDmo.name,
      this.currentDmo.movieTitle,
      this.currentDmo.shortComment));
      if (!result) {
        this.toastr.error('Faild to create dmo');
        await this.closeEditor();
        return;
      }
      this.currentDmo.id = result.id;
      this.currentDmo.name = result.name;
      this.currentDmo.movieTitle = result.movieTitle;
      this.currentDmo.shortComment = result.shortComment;
  }

  private async finalizePopup(popupData: any = null): Promise<boolean> {
    this.initialPopup = this.matModule.open(InitialPopupComponent, {
      data: popupData,
      width: '400px' });
    this.isInitialPopupOpen = true;

    return await this.setInitialData();
  }


  private async openConnection() {
    await this.connect();
  }

  private async setInitialData(): Promise<boolean> {
    const dmoinfo = await this.initialPopup.afterClosed().toPromise();
    this.isInitialPopupOpen = false;
    if (!dmoinfo || dmoinfo.cancelled && !dmoinfo.dmoName) {
      this.isDmoInfoSet = false;
    } else {
      if (!this.currentDmo) {
        this.currentDmo = new DmoDto();
      }
      this.currentDmo.name = dmoinfo.dmoName;
      this.currentDmo.movieTitle = dmoinfo.movieTitle;
      this.currentDmo.shortComment = dmoinfo.shortComment;
      this.isDmoInfoSet = true;
    }
    return !dmoinfo.cancelled;
  }

  private async setLoadedData() {
    const loadedDmo = await this.editorHub.loadDmo(this.dmoId);
    if (!loadedDmo) {
      this.toastr.error('Failed to load dmo');
      return;
    }
    this.currentDmo = loadedDmo;
    this.isDmoInfoSet = true;
  }

  private async setEditedData() {
    const data: EditDmoInfoDto = {
      id: this.currentDmo.id,
      name: this.currentDmo.name,
      movieTitle: this.currentDmo.movieTitle,
      shortComment: this.currentDmo.shortComment
    };
    const updatedDmo = await this.editorHub.editDmo(data);
    if (!updatedDmo) {
      this.toastr.error('Failed to update dmo');
      return;
    }
    this.currentDmo.id = updatedDmo.id;
    this.currentDmo.name = updatedDmo.name;
    this.currentDmo.movieTitle = updatedDmo.movieTitle;
    this.currentDmo.shortComment = updatedDmo.shortComment;
  }

}
