import { SidebarTabs } from './../models';
import { CurrentSidebarService } from './../../shared/services/current-sidebar.service';
import { RightMenues } from '../models';
import { Component, OnInit, Output, EventEmitter, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserManager } from 'src/app/shared/services/user-manager';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isActive: boolean;
  collapsed: boolean;
  showMenu: string;
  pushRightClass: string;

  @Output() collapsedEvent = new EventEmitter<boolean>();
  @Output() toggleRightMenu = new EventEmitter<RightMenues>();
  isAuthorized = false;

  constructor(
    public router: Router,
    public userManager: UserManager,
    private currestSidebarService: CurrentSidebarService) {
    this.isAuthorized = userManager.isAuthorized();
    this.router.events.subscribe(val => {
      if (
        val instanceof NavigationEnd &&
        window.innerWidth <= 992 &&
        this.isToggled()
      ) {
        this.toggleSidebar();
      }
    });
  }

  ngOnInit() {
    this.isActive = false;
    this.collapsed = false;
    this.showMenu = '';
    this.pushRightClass = 'push-right';
    this.router.navigateByUrl('/');

    this.currestSidebarService.currentMenuSource$.subscribe();
  }

  eventCalled() {
    this.isActive = !this.isActive;
  }

  addExpandClass(element: any) {
    if (element === this.showMenu) {
      this.showMenu = '0';
    } else {
      this.showMenu = element;
    }
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    this.collapsedEvent.emit(this.collapsed);
  }

  isToggled(): boolean {
    const dom: Element = document.querySelector('body');
    return dom.classList.contains(this.pushRightClass);
  }

  toggleSidebar() {
    const dom: any = document.querySelector('body');
    dom.classList.toggle(this.pushRightClass);
  }

  sendDmoCollectionsEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.dmoCollections);
    this.toggleRightMenu.emit(RightMenues.dmoCollections);
  }

  sendDmosEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.dmos);
    this.toggleRightMenu.emit(RightMenues.dmos);
  }

  sendDashboardEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.dashboard);
    this.toggleRightMenu.emit(RightMenues.dashboard);
  }

  sendDmoEvent() {
    this.currestSidebarService.setMenu(SidebarTabs.dmo);
    this.toggleRightMenu.emit(RightMenues.dmo);
  }
}
