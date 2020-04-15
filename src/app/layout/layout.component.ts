import { RightMenuGrabberService } from './../shared/services/right-menu-grabber.service';
import { CurrentSidebarService } from './../shared/services/current-sidebar.service';
import { CollectionsManagerService } from './../shared/services/collections-manager.service';
import { Observable } from 'rxjs';
import { RightMenues } from './models';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, AfterViewInit {

    @ViewChild('rightMenu', { static: true }) rightMenu: MatSidenav;
    collapedSideBar: boolean;
    toggleRightMenu: RightMenues;
    currentMenuName: string;
    currentUserFriendlyMenuName: string;
    rightMenuIsClosing$: Observable<void>;

    constructor(
        private collectionService: CollectionsManagerService,
        private currestSidebarService: CurrentSidebarService,
        private rightMenuGrabberService: RightMenuGrabberService) { }

    ngOnInit() { }

    ngAfterViewInit(): void {
        this.rightMenuIsClosing$ = this.rightMenu.closedStart;
    }

    closeByBackdrop() {
        if (!this.collectionService.getCurrentCollectionId()) {
            this.collectionService.setCollectionId('');
            this.resetMenues();
            this.currestSidebarService.setPrevious();
        }
    }

    closeRightMenu() {
        this.rightMenu.close();
    }

    receiveCollapsed($event) {
        this.collapedSideBar = $event;
    }

    receiveRightMenu($event) {
        this.resetMenues();
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
        }
    }

    oppenedByGrabber($event) {
        this.receiveRightMenu($event);
    }

    private getCurrentUserFriendlyRightMenu(menu: RightMenues) {
        switch (menu) {
            case RightMenues.dmoCollections: return 'DMO collections';
            default: return '';
        }
    }

    private resetMenues() {
        this.currentMenuName = '';
        this.currentUserFriendlyMenuName = '';
        this.toggleRightMenu = null;
    }

}
