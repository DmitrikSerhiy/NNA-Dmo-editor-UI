import { AfterContentInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/operators';
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
	private refreshSubscription: Subscription;
	userName: string;

	constructor(
		private router: Router, 
		private userManager: UserManager,
		private authService: AuthService,
		private refreshHelperService: RefreshHelperService) { }

	ngOnInit() {
		this.authService
			.ping()
			.pipe(take(1))
			.subscribe(() =>  {
					this.isAuthorized = true;
					this.userName = this.userManager.getCurrentUser();
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
										this.userName = this.userManager.getCurrentUser();
									}
								}, 
								() => {
									this.isAuthorized = false;
								});
					}
				}); 		
	};

	scrollToPlotPoint(plotPointElement: HTMLElement): void {
		plotPointElement.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
	}

	toRegistration() {
		this.router.navigate(["/signup"]);
	}

	toLogin() {
		this.router.navigate(["/login"]);
	}

	toLayout() {
		this.authService
			.ping()
			.pipe(take(1))
			.subscribe({
				next: () =>  this.router.navigate(["/app"]),
				error: (_) => { 
					this.router.navigate(["/login"]); 
					this.userManager.clearUserData();
				} 
			});
	}

	ngOnDestroy(): void {
		this.refreshSubscription?.unsubscribe();
	}
}
