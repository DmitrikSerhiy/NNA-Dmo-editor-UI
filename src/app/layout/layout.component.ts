import { RightMenuGrabberService } from './../shared/services/right-menu-grabber.service';
import { CurrentSidebarService } from './../shared/services/current-sidebar.service';
import { CollectionsManagerService } from './../shared/services/collections-manager.service';
import { RightMenues, SidebarTabs } from './models';
import { Component, OnInit, ViewChild, AfterViewInit, EventEmitter, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { SidebarManagerService } from '../shared/services/sidebar-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NnaHelpersService } from '../shared/services/nna-helpers.service';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('rightMenu', { static: true }) rightMenu: MatSidenav;
    toggleRightMenu: RightMenues;
    currentMenuName: string;
    currentUserFriendlyMenuName: string;
    rightMenuIsClosing$: Observable<void>;
    rightMenuIsOpening$ = new EventEmitter<void>();
    isAuthorized: boolean = false;
    isGrabberShouldBeShown: boolean = false;
    updateUserNameDisplay$: EventEmitter<void>;

    private grabberSubscription: Subscription;
    private urlSubsription: Subscription;
    private styleUrlSubscription: Subscription;


    constructor(
        private collectionService: CollectionsManagerService,
        private currentSidebarService: CurrentSidebarService,
        private rightMenuGrabberService: RightMenuGrabberService,
        public sidebarManagerService: SidebarManagerService,
        private route: ActivatedRoute,
        private router: Router,
        private nnaHelpersService: NnaHelpersService) { }

    ngOnInit() { 
        this.updateUserNameDisplay$ = new EventEmitter<void>(); 
        this.grabberSubscription = this.rightMenuGrabberService.shouldShowGrabber$.subscribe({
            next: async (shoudBeShown: boolean) => {
                if (shoudBeShown === false) {
                    this.isGrabberShouldBeShown = shoudBeShown;
                } else {
                    await this.nnaHelpersService.sleep(1000);
                    this.isGrabberShouldBeShown = shoudBeShown;
                }
            }  
        });

        this.urlSubsription = this.route.queryParams.subscribe(param => {
            if (param.collectionId) {
                this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu(RightMenues.dmoCollections);
                this.currentMenuName = RightMenues.dmoCollections;
                this.rightMenuIsClosing$ = this.rightMenu.closedStart;
                this.rightMenuGrabberService.showGrabber();
            }
        });
    }

    ngAfterViewInit(): void {
        this.styleUrlSubscription = this.route.queryParams.subscribe(param => {
            if (param.collectionId) {
                this.currentSidebarService.setMenu(SidebarTabs.dmoCollections);
            }
        });
        this.rightMenuIsClosing$ = this.rightMenu.closedStart;
    }

    ngOnDestroy(): void {
        this.grabberSubscription?.unsubscribe();
        this.urlSubsription?.unsubscribe();
        this.styleUrlSubscription?.unsubscribe();
    }

    async handleInnerSidebarEvent($event: any) {
        if ($event == null) {
            this.currentSidebarService.setPrevious();
            return;
        }
        
        this.resetMenues();
        if (window.location.href.includes('editor')) {
            this.router.navigate(['/app/editor'], {queryParams: {dmoId: $event.id}}).then((_ => window.location.reload()));
        } else {
            this.router.navigate(['/app/editor'], {queryParams: {dmoId: $event.id}});
        }
    }

    closeByBackdrop() {
        if (!this.collectionService.getCurrentCollectionId()) {
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
        } else if ($event === RightMenues.dmo) {
            this.rightMenuGrabberService.hideGrabber();
        } else if ($event === RightMenues.userCabinet) {
            this.currentMenuName = RightMenues.userCabinet;
            this.rightMenuGrabberService.hideGrabber();
            this.toggleRightMenu = $event;
        }
        //  else if ($event === RightMenues.test) {
        //     this.currentMenuName = RightMenues.test;
        //     this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu($event);
        //     this.rightMenuGrabberService.showGrabber();
        //     this.toggleRightMenu = $event;
        // }
    }

    openRightMenuByGrabber($event) {
        this.openRightMenu($event);
    }

    updateUserName() {
        this.updateUserNameDisplay$.emit()
    }

    private getCurrentUserFriendlyRightMenu(menu: RightMenues) {
        switch (menu) {
            case RightMenues.dmoCollections: return 'DMO collections';
            case RightMenues.userCabinet: return 'Personal info';
            // case RightMenues.test: return 'Test'
            default: return '';
        }
    }

    private resetMenues() {
        this.currentMenuName = '';
        this.currentUserFriendlyMenuName = '';
        this.toggleRightMenu = null;
    }

}
