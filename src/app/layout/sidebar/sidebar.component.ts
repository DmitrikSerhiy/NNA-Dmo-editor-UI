import { SidebarTabs } from './../models';
import { CurrentSidebarService } from './../../shared/services/current-sidebar.service';
import { RightMenues } from '../models';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserManager } from 'src/app/shared/services/user-manager';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isAuthorized: boolean;
  sidebarState: boolean;
  @Output() toggleRightMenu$: EventEmitter<RightMenues>;

  constructor(
    public userManager: UserManager,
    private currestSidebarService: CurrentSidebarService,
    private sidebarManagerService: SidebarManagerService) { 
      this.toggleRightMenu$ = new EventEmitter<RightMenues>();
    }

  ngOnInit() {
    this.isAuthorized = this.userManager.isAuthorized();
    this.currestSidebarService.currentMenuSource$.subscribe();
    this.sidebarManagerService.sidebarObserver$.subscribe((event$) => { this.sidebarState = event$; })
    this.sidebarState = this.sidebarManagerService.IsOpen;
  }

  toggleSidebar() {
    this.sidebarManagerService.toggleSidebar();
  }

  sendDmoCollectionsEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.dmoCollections);
    this.toggleRightMenu$.emit(RightMenues.dmoCollections);
  }

  sendTestEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.test);
    this.toggleRightMenu$.emit(RightMenues.test);
  }

  sendDmosEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.dmos);
    this.toggleRightMenu$.emit(RightMenues.dmos);
  }

  sendDashboardEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.dashboard);
    this.toggleRightMenu$.emit(RightMenues.dashboard);
  }

  sendDmoEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.dmo);
    this.toggleRightMenu$.emit(RightMenues.dmo);
  }
}
