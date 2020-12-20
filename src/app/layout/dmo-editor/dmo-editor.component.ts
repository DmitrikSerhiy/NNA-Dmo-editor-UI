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

  constructor(
    private editorHub: EditorHub,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: Toastr,
    public matModule: MatDialog,
    private sidebarManagerService: SidebarManagerService) { }

  async ngOnInit() {
    this.isDmoInfoSet = true;

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

  async createAndInitDmo() {
    let tempDmo = new ShortDmoDto('test name', 'test movie');
    tempDmo.id = 'some id';
    tempDmo.shortComment = 'some comment';
    this.initDmo(tempDmo);

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
