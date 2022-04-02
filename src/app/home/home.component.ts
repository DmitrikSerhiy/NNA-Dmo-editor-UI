import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { TokenDetails } from '../shared/models/serverResponse';
import { AuthService } from '../shared/services/auth.service';
import { RefreshHelperService } from '../shared/services/refresh-helper.service';
import { UserManager } from '../shared/services/user-manager';


@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

	isAuthorized: boolean;
	private verifySubscription: Subscription;
	private refreshSubscription: Subscription;

	constructor(
		private router: Router, 
		private userManager: UserManager,
		private authService: AuthService,
		private refreshHelperService: RefreshHelperService) { }

	ngOnInit() {
		this.authService
			.ping()
			.subscribe(() =>  {
					this.isAuthorized = true;
				},
				(response: any) => { 
					if (response.headers.get('ExpiredToken')) {
						this.refreshSubscription = this.refreshHelperService
							.tryRefreshTokens(false)
							.subscribe(
								(tokenResponse: TokenDetails) => {
									if (tokenResponse.accessToken && tokenResponse.refreshToken) {
										this.userManager.updateTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
										this.isAuthorized = true;
									}
								}, 
								() => {
									this.isAuthorized = false;
								});
					}
				}); 		
	};

	toRegistration() {
		this.router.navigate(["/signup"]);
	}

	toLogin() {
		this.router.navigate(["/login"]);
	}

	toLayout() {
		this.verifySubscription = this.authService
			.ping()
			.subscribe({
				next: () =>  this.router.navigate(["/app"]),
				error: (_) => { 
					this.router.navigate(["/login"]); 
					this.userManager.clearUserData();
				} 
			});
	}

	ngOnDestroy(): void {
		if (this.verifySubscription) {
			this.verifySubscription.unsubscribe();
		}
		if (this.refreshSubscription) {
			this.refreshSubscription.unsubscribe();
		}
	}
}
