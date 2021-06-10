import { SidebarTabs } from './../models';
import { CurrentSidebarService } from './../../shared/services/current-sidebar.service';
import { RightMenues } from '../models';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserManager } from 'src/app/shared/services/user-manager';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { Router } from '@angular/router';

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
    private sidebarManagerService: SidebarManagerService,
    private router: Router) { 
      this.toggleRightMenu$ = new EventEmitter<RightMenues>();
    }

  ngOnInit() {
    this.isAuthorized = this.userManager.isAuthorized();
    this.currestSidebarService.currentMenuSource$.subscribe();
    this.sidebarManagerService.sidebarObserver$.subscribe((event$) => { this.sidebarState = event$; })
    this.sidebarState = this.sidebarManagerService.IsOpen;
  }

  onLoggedout() {
    this.userManager.logout();
  }

  toggleSidebar() {
    if (this.isAuthorized) {
      this.sidebarManagerService.toggleSidebar();
    }
  }

  sendDmoCollectionsEvent() {
    if (this.isAuthorized) {
      this.currestSidebarService.setMenu(SidebarTabs.dmoCollections);
      this.toggleRightMenu$.emit(RightMenues.dmoCollections);
    }
  }

  // sendTestEvent() {
  //   if (this.isAuthorized) {
  //     this.currestSidebarService.setMenu(SidebarTabs.test);
  //     this.toggleRightMenu$.emit(RightMenues.test);
  //   }
  // }

  redirectToHome() {
    this.router.navigate(['/']);
  }

  sendDmosEvent() {
    if (this.isAuthorized) {
      this.currestSidebarService.setMenu(SidebarTabs.dmos);
      this.toggleRightMenu$.emit(RightMenues.dmos);
    }
  }

  sendDmoEvent() {
    if (this.isAuthorized) {
      this.currestSidebarService.setMenu(SidebarTabs.dmo);
      this.toggleRightMenu$.emit(RightMenues.dmo);
    }
  }
}
