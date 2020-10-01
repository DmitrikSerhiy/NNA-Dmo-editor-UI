import { SidebarTabs } from './../models';
import { CurrentSidebarService } from './../../shared/services/current-sidebar.service';
import { RightMenues } from '../models';
import { Component, OnInit, Output, EventEmitter, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserManager } from 'src/app/shared/services/user-manager';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  collapsed: boolean;
  isAuthorized: boolean;

  @Output() sidebarEvent$ = new EventEmitter<boolean>();
  @Output() toggleRightMenu$ = new EventEmitter<RightMenues>();

  constructor(
    public userManager: UserManager,
    private currestSidebarService: CurrentSidebarService,
    private sidebarManagerService: SidebarManagerService) { }

  ngOnInit() {
    this.isAuthorized = this.userManager.isAuthorized();
    this.collapsed = false;


    // this.collapsedEvent.subscribe(() => { this.toggleCollapsed(); })
    this.currestSidebarService.currentMenuSource$.subscribe();
    // this.sidebarManagerService.subscibe(this.collapsedEvent);
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.sidebarEvent$.emit(this.collapsed);
    // this.sidebarManagerService.toggleSidebar(this.collapsed);
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
