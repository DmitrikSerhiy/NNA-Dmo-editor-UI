import { RightMenuGrabberService } from './../shared/services/right-menu-grabber.service';
import { CurrentSidebarService } from './../shared/services/current-sidebar.service';
import { CollectionsManagerService } from './../shared/services/collections-manager.service';
import { RightMenues, SidebarTabs } from './models';
import { Component, OnInit, ViewChild, AfterViewInit, EventEmitter, OnDestroy, ElementRef } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { SidebarManagerService } from '../shared/services/sidebar-manager.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { NnaHelpersService } from '../shared/services/nna-helpers.service';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';
import { filter } from 'rxjs/operators';


@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('rightMenu', { static: true }) rightMenu: MatSidenav;
    @ViewChild('mainContainer', { static: true }) mainContainer: ElementRef;
    
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
                    await this.nnaHelpersService.setTimeoutAsync(1000);
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
            } else if (this.router.url.includes('editor')) {
                this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu(RightMenues.tags);
                this.currentMenuName = RightMenues.tags;
                this.rightMenuIsClosing$ = this.rightMenu.closedStart;
                this.rightMenuGrabberService.showGrabber();
            } else {
                this.rightMenuGrabberService.hideGrabber();
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

        if (this.router.url.includes('editor')) {
            this.mainContainer.nativeElement.style.backgroundImage = 'url("../../assets/editor_background.jpeg")';
            this.mainContainer.nativeElement.style.height = 'unset';
        }

        this.router.events.pipe(filter(event => event instanceof NavigationStart))
            .subscribe((event:NavigationStart) => {
                if (event.url.includes('editor')) {
                    this.mainContainer.nativeElement.style.backgroundImage = 'url("../../assets/editor_background.jpeg")';
                    this.mainContainer.nativeElement.style.height = 'unset';
                } else {
                    this.mainContainer.nativeElement.style.backgroundImage = 'unset';
                    this.mainContainer.nativeElement.style.height = '100%';
                }
            });
    }

    ngOnDestroy(): void {
        this.grabberSubscription?.unsubscribe();
        this.urlSubsription?.unsubscribe();
        this.styleUrlSubscription?.unsubscribe();
    }

    async handleInnerSidebarEvent($event: any) {
        if ($event == null) {
            if (window.location.href.includes('editor')) {
                this.currentSidebarService.resetTabs();
            } else {
                this.currentSidebarService.setPrevious();
            }
            return;
        }
        
        this.resetMenues();
        this.currentSidebarService.resetTabs();
        this.router.navigate(['/app/editor'], {queryParams: {dmoId: $event.id} });
    }

    closeByBackdrop() {
        if (this.collectionService.getCurrentCollectionId()) {
            this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu(RightMenues.dmoCollections);
            this.currentMenuName = RightMenues.dmoCollections;
            this.rightMenuGrabberService.showGrabber();
        } else if (this.router.url.includes('editor')) {
            this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu(RightMenues.tags);
            this.currentMenuName = RightMenues.tags;
            this.rightMenuGrabberService.showGrabber();
        } else {
            this.resetMenues();
        }
        if (window.location.href.includes('editor')) {
            this.currentSidebarService.resetTabs();
        } else {
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
            this.setCollectionsRightMenu();
            this.rightMenuGrabberService.showGrabber();
        } else if ($event === RightMenues.tags) {
            this.setTagsRightMenu();
            this.rightMenuGrabberService.showGrabber();
        } else if ($event === RightMenues.userCabinet) {
            this.currentMenuName = RightMenues.userCabinet;
            this.rightMenuGrabberService.hideGrabber();
            this.toggleRightMenu = $event;
        } else {
            this.rightMenuGrabberService.hideGrabber();
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
            case RightMenues.tags: return 'Tags';
            // case RightMenues.test: return 'Test'
            default: return '';
        }
    }

    private setTagsRightMenu() {
        this.currentMenuName = RightMenues.tags;
        this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu(RightMenues.tags);
        this.toggleRightMenu = RightMenues.tags;
    }

    private setCollectionsRightMenu() {
        this.currentMenuName = RightMenues.dmoCollections;
        this.currentUserFriendlyMenuName = this.getCurrentUserFriendlyRightMenu(RightMenues.dmoCollections);
        this.toggleRightMenu = RightMenues.dmoCollections;
    }

    private resetMenues() {
        this.currentMenuName = '';
        this.currentUserFriendlyMenuName = '';
        this.toggleRightMenu = null;
    }

}
