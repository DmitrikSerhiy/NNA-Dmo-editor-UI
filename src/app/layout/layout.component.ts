import { RightMenuGrabberService } from './../shared/services/right-menu-grabber.service';
import { CurrentSidebarService } from './../shared/services/current-sidebar.service';
import { CollectionsManagerService } from './../shared/services/collections-manager.service';
import { Observable } from 'rxjs';
import { RightMenues, SidebarTabs } from './models';
import { Component, OnInit, ViewChild, AfterViewInit, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { SidebarManagerService } from '../shared/services/sidebar-manager.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { UserManager } from '../shared/services/user-manager';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, AfterViewInit {

    @ViewChild('rightMenu', { static: true }) rightMenu: MatSidenav;
    toggleRightMenu: RightMenues;
    currentMenuName: string;
    currentUserFriendlyMenuName: string;
    rightMenuIsClosing$: Observable<void>;
    rightMenuIsOpening$ = new EventEmitter<void>();
    isAuthorized: boolean = false;
    isGrabbershouldBeShown: boolean = false;

    constructor(
        private collectionService: CollectionsManagerService,
        private currentSidebarService: CurrentSidebarService,
        private rightMenuGrabberService: RightMenuGrabberService,
        public sidebarManagerService: SidebarManagerService,
        private route: ActivatedRoute,
        private cd: ChangeDetectorRef) { }

    ngOnInit() { 
        this.rightMenuGrabberService.shouldShowGrabber$.subscribe({
            next: async () => this.isGrabbershouldBeShown = await this.rightMenuGrabberService.isGrabbershouldBeShown()
          });
          this.route.queryParams.subscribe(param => {
            if (!param.collectionId) {
              this.collectionService.setCollectionId('');
            } else if (param.collectionId) {
              this.collectionService.setCollectionId(param.collectionId);
              this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu(RightMenues.dmoCollections);
              this.currentMenuName = RightMenues.dmoCollections;
              this.rightMenuIsClosing$ = this.rightMenu.closedStart;
              this.rightMenuGrabberService.showGrabber();
            }
        });
    }

    ngAfterViewInit(): void {
        this.route.queryParams.subscribe(param => {
            if (!param.collectionId) {
            
            } else if (param.collectionId) {
                this.currentSidebarService.setMenu(SidebarTabs.dmoCollections);
            }
        });
        this.rightMenuIsClosing$ = this.rightMenu.closedStart;
    }

    closeByBackdrop() {
        if (!this.collectionService.getCurrentCollectionId()) {
            this.collectionService.setCollectionId('');
            this.resetMenues();
            this.currentSidebarService.setPrevious();
        }
    }

    closeRightMenu() {
        this.rightMenu.close();
    }

    openRightMenu($event) {
        this.resetMenues();
        this.rightMenuIsOpening$.emit();
        if ($event === RightMenues.dmoCollections) {
            this.currentMenuName = RightMenues.dmoCollections;
            this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu($event);
            this.rightMenuGrabberService.showGrabber();
            this.toggleRightMenu = $event;
        } else if ($event === RightMenues.dmos) {
            this.rightMenuGrabberService.hideGrabber();
            this.collectionService.setCollectionId('');
        } else if ($event === RightMenues.dashboard) {
            this.rightMenuGrabberService.hideGrabber();
            this.collectionService.setCollectionId('');
        } else if ($event === RightMenues.test) {
            this.currentMenuName = RightMenues.test;
            this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu($event);
            this.rightMenuGrabberService.showGrabber();
            this.toggleRightMenu = $event;
        }
    }

    openRightMenuByGrabber($event) {
        this.openRightMenu($event);
    }

    private getCurrentUserFriendlyRightMenu(menu: RightMenues) {
        switch (menu) {
            case RightMenues.dmoCollections: return 'DMO collections';
            case RightMenues.test: return 'Test'
            default: return '';
        }
    }

    private resetMenues() {
        this.currentMenuName = '';
        this.currentUserFriendlyMenuName = '';
        this.toggleRightMenu = null;
    }

}
