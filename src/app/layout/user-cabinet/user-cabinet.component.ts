import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserManager } from 'src/app/shared/services/user-manager';

@Component({
	selector: 'app-user-cabinet',
	templateUrl: './user-cabinet.component.html',
	styleUrls: ['./user-cabinet.component.scss']
})
export class UserCabinetComponent implements OnInit, OnDestroy {

	@Input() rightMenuIsClosing$: Observable<void>;
	@Input() rightMenuIsOpening$: EventEmitter<void>;
	@Output() closeRightMenu = new EventEmitter<void>();
	rightMenuOpnSubscription: Subscription;
	rightMenuClsSubscription: Subscription;
	isFormProcessing = false;

	private logoutSubscription: Subscription;

 	private unsubscribe$: Subject<void> = new Subject();
  
	constructor(		
		private userManager: UserManager,
		private authService: AuthService,
		private router: Router) { }

	ngOnInit(): void {
		this.rightMenuClsSubscription = this.rightMenuIsClosing$.subscribe(() => {
			// do some shit on close menu
		});
		this.rightMenuOpnSubscription = this.rightMenuIsOpening$.subscribe(() => {
			// do some shit on open menu
		})

		this.isFormProcessing = false;
	}

	onLoggedout() {
    	this.logoutSubscription = this.authService
			.logout(this.userManager.getCurrentUserEmail())
			.subscribe(_ => {
					this.userManager.clearUserData();
					this.router.navigate(['/'])
				}
			);
  	}

	ngOnDestroy(): void {
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
		this.rightMenuOpnSubscription?.unsubscribe();
		this.rightMenuClsSubscription?.unsubscribe();
		this.logoutSubscription?.unsubscribe();
	}

}
