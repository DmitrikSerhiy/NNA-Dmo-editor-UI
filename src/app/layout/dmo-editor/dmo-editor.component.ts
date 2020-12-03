import { ShortDmoDto } from './../models';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

import { EditorHub } from './services/editor-hub.sercice';

import { Toastr } from '../../shared/services/toastr.service';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { ToastrErrorMessage } from 'src/app/shared/models/serverResponse';

@Component({
  selector: 'app-dmo-editor',
  templateUrl: './dmo-editor.component.html',
  styleUrls: ['./dmo-editor.component.scss']
})
export class DmoEditorComponent implements OnInit, OnDestroy {
  @ViewChild('dmobit', { static: true }) dmobit: ElementRef;
  dmoId: string;
  isDmoInfoSet = false;
  isInitialPopupOpen = false;
  initialPopup: MatDialogRef<InitialPopupComponent>;
  currentDmo: ShortDmoDto;

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
      await this.editorHub.startConnection();
      await this.setLoadedDmo();
      this.sidebarManagerService.collapseSidebar();
    } else {
      await this.setDmoInfo();
    }
  }

  async setDmoInfo() {
    const cancelled = await this.finalizePopup();
    if (!cancelled) {
      await this.editorHub.startConnection();
      await this.createAndInitDmo();
      this.sidebarManagerService.collapseSidebar();
    }
  }

  async ngOnDestroy() {
    await this.editorHub.abortConnection();
    this.dmoId = '';
    this.isDmoInfoSet = false;
    this.matModule.closeAll();
    this.initialPopup = null;
  }

  async closeEditor() {
    await this.editorHub.abortConnection();
    this.isDmoInfoSet = false;
    this.currentDmo = null;
    this.matModule.closeAll();
    this.initialPopup = null;
  }

  private async finalizePopup(popupData: any = null): Promise<boolean> {
    this.initialPopup = this.matModule.open(InitialPopupComponent, {
      data: popupData,
      width: '400px' });
    this.isInitialPopupOpen = true;

    const popupResult = await this.initialPopup.afterClosed().toPromise();
    this.isInitialPopupOpen = false;
    if (!popupResult || popupResult.cancelled) {
      return true;
    } 

    this.initDmo(popupResult);
    return false;
  }

  private async createAndInitDmo() {
    const result = await this.editorHub.createDmo(this.currentDmo);
      if (!result) {
        this.toastr.error(new ToastrErrorMessage('Faild to create dmo', 'Server error'));
        return;
      }
      this.initDmo(result);
  }

  private async setLoadedDmo() {
    const result = await this.editorHub.LoadShortDmo(this.dmoId);
    if (!result) {
      this.toastr.error(new ToastrErrorMessage('Failed to load dmo', 'Server error'));
      return;
    }
    this.initDmo(result);
  }

  async editCurrentDmo() {
    const cancelled = await this.finalizePopup(this.currentDmo);
    if (!cancelled) {
      const result = await this.editorHub.updateShortDmo(this.currentDmo);
      if (!result) {
        this.toastr.error(new ToastrErrorMessage('Failed to update dmo', 'Server error'));
        return;
      }
      this.initDmo(result);
    }
  }

  private initDmo(result: ShortDmoDto) {
    if (!this.currentDmo) {
      this.currentDmo = new ShortDmoDto(result.name, result.movieTitle);
    } else {
      this.currentDmo.name = result.name;
      this.currentDmo.movieTitle = result.movieTitle;
    }
    if(result.id) {
      this.currentDmo.id = result.id;
    }
    this.currentDmo.shortComment = result.shortComment;
    this.isDmoInfoSet = true;
  }

}
