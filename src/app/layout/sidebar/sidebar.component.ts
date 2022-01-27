import { SidebarTabs } from './../models';
import { CurrentSidebarService } from './../../shared/services/current-sidebar.service';
import { RightMenues } from '../models';
import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserManager } from 'src/app/shared/services/user-manager';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Toastr } from 'src/app/shared/services/toastr.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
	isAuthorized: boolean;
	sidebarState: boolean;
	@Output() toggleRightMenu$: EventEmitter<RightMenues>;
	private currMenuSubscription: Subscription;
	private sidebarSubscription: Subscription;
	private currentUserEmailSubscription: Subscription;

  	constructor(
		public userManager: UserManager,
		private authService: AuthService,
		private currestSidebarService: CurrentSidebarService,
		private sidebarManagerService: SidebarManagerService,
		private router: Router,
    	private toastr: Toastr) { 
      	this.toggleRightMenu$ = new EventEmitter<RightMenues>();
    }

  	ngOnInit() {
		this.isAuthorized = this.userManager.isAuthorized();
		this.currMenuSubscription = this.currestSidebarService.currentMenuSource$.subscribe();
		this.sidebarSubscription = this.sidebarManagerService.sidebarObserver$.subscribe((event$) => { this.sidebarState = event$; })
		this.sidebarState = this.sidebarManagerService.IsOpen;
  	}

  	onLoggedout() {
    	this.currentUserEmailSubscription = this.authService
			.logout(this.userManager.getCurrentUserEmail())
			.subscribe(_ => {
					this.userManager.clearUserData();
					this.router.navigate(['/'])
				}, 
				(error) => {
					this.toastr.error(error)
				}
			);
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
		}
	}

	sendDmoEvent() {
		if (this.isAuthorized) {
			this.currestSidebarService.setMenu(SidebarTabs.dmo);
		}
	}

	ngOnDestroy(): void {
		this.currMenuSubscription.unsubscribe();
		this.sidebarSubscription.unsubscribe();
		this.currentUserEmailSubscription.unsubscribe();
	}
}
