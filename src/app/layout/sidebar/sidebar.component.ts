import { ShortDmoDto, SidebarTabs } from './../models';
import { CurrentSidebarService } from './../../shared/services/current-sidebar.service';
import { RightMenues } from '../models';
import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { UserManager } from 'src/app/shared/services/user-manager';
import { SidebarManagerService } from 'src/app/shared/services/sidebar-manager.service';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DmoEditorPopupComponent } from '../dmo-editor-popup/dmo-editor-popup.component';
import { DmosService } from 'src/app/shared/services/dmos.service';
import { take } from 'rxjs/internal/operators/take';
import { NnaHelpersService } from 'src/app/shared/services/nna-helpers.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
	isAuthorized: boolean;
	sidebarState: boolean;
	@Input() updateUserNameDisplay: EventEmitter<void>;
	@Output() innerEvent$: EventEmitter<any> = new EventEmitter<any>();
	@Output() toggleRightMenu$: EventEmitter<RightMenues> = new EventEmitter<RightMenues>();
	private currMenuSubscription: Subscription;
	private sidebarSubscription: Subscription;
	private currentUserEmailSubscription: Subscription;
	userName: string;
	initialPopup: MatDialogRef<DmoEditorPopupComponent>;

  	constructor(
		private userManager: UserManager,
		private currestSidebarService: CurrentSidebarService,
		public sidebarManagerService: SidebarManagerService,
		private router: Router,
		private matModule: MatDialog,
		private dmosService: DmosService) { }

  	async ngOnInit() {
		this.isAuthorized = this.userManager.isAuthorized();
		this.currMenuSubscription = this.currestSidebarService.currentMenuSource$.subscribe();
		this.sidebarSubscription = this.sidebarManagerService.sidebarObserver$.subscribe((event$) => { this.sidebarState = event$; })
		this.sidebarState = this.sidebarManagerService.IsOpen;
		this.userName = this.userManager.getCurrentUser();
		this.updateUserNameDisplay.subscribe(() => { this.userName = this.userManager.getCurrentUser(); } );
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

	sendUserCabinetEvent() {
		if (this.isAuthorized) {
			this.currestSidebarService.setMenu(SidebarTabs.userCabinet);
			this.toggleRightMenu$.emit(RightMenues.userCabinet);
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

	async sendDmoEvent($event: any) {
		$event.preventDefault();
		if (!this.isAuthorized) {
			return;
		}

		this.currestSidebarService.currentMenuSource$
		this.currestSidebarService.setMenu(SidebarTabs.dmo);
		this.toggleRightMenu$.emit(RightMenues.dmo);

		this.initialPopup = this.matModule.open(DmoEditorPopupComponent, { data: null, width: '400px' });
		const popupResult = await this.initialPopup.afterClosed().toPromise();

		if (!popupResult || popupResult.cancelled) {
			this.innerEvent$.emit(null);
			return;
		} 

		let newDmoDetails = { name: popupResult.name, movieTitle: popupResult.movieTitle } as ShortDmoDto;
		newDmoDetails.shortComment = popupResult.shortComment;
		newDmoDetails.dmoStatus = +popupResult.dmoStatus;

		this.dmosService.createDmo(newDmoDetails).pipe(take(1))
			.subscribe((newDmoResult) => {
				this.initialPopup = null;
				this.matModule.ngOnDestroy();
				this.innerEvent$.emit(newDmoResult);
			});
		
	}

	ngOnDestroy(): void {
		this.currMenuSubscription?.unsubscribe();
		this.sidebarSubscription?.unsubscribe();
		this.currentUserEmailSubscription?.unsubscribe();
	}
}
