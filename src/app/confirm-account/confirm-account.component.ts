import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthService } from '../shared/services/auth.service';
import { UserManager } from '../shared/services/user-manager';

@Component({
	selector: 'app-confirm-account',
	templateUrl: './confirm-account.component.html',
	styleUrls: ['./confirm-account.component.scss']
})
export class ConfirmAccountComponent implements OnInit, OnDestroy {

  	token: string;
	private confirmEmailSubscription: Subscription;
	private sendEmailSubscripton: Subscription;
	isConfirmed: boolean;
	failedToConfirm: boolean;
	errorMessage: string;
	emailIsSent: boolean;
	userIsNotAuthorized: boolean;
	currentUserEmail: string;
	isProcessing: boolean;

  	constructor(		
    	private router: Router,
		private route: ActivatedRoute,
		private authService: AuthService,
		public userManager: UserManager) { }


	ngOnInit(): void {
		if (!this.userManager.isAuthorized()) {
			this.userIsNotAuthorized = true;
			return;
		}

		this.token = this.route.snapshot.queryParamMap.get("token");
		if (!this.token) {
			return;
		}

		this.currentUserEmail = this.userManager.getCurrentUserEmail();
		this.isProcessing = true;
		this.confirmEmailSubscription = this.authService
			.confirmAccount(this.currentUserEmail, this.token)
			.subscribe(() => {
				this.isConfirmed = true;
				this.isProcessing = false;
			}, (error) => {
				if (!error.message) {
					this.errorMessage = error;
				}
				this.failedToConfirm = true;
				this.isProcessing = false;
			});
	}

	sendConfirmEmail() {
		this.isProcessing = true;
		this.sendEmailSubscripton = this.authService
			.sendConfirmEmail(this.currentUserEmail)
			.subscribe(() => {
				this.emailIsSent = true;
				this.isProcessing = false;

			}, () => {
				this.isProcessing = false;
			});
	}

	toLogin() {
		this.router.navigate(['/login']);
	}

	toLoginAgain() {
		this.userManager.clearUserData();
		this.router.navigate(['/login']);
	}

	ngOnDestroy(): void {
		this.confirmEmailSubscription?.unsubscribe();
		this.sendEmailSubscripton?.unsubscribe();
	}

}
