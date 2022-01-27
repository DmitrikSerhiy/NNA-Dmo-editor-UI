import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { UserManager } from '../shared/services/user-manager';


@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

	isAuthorized: boolean;
	private verifySubscription: Subscription;

	constructor(
		private router: Router, 
		private userManager: UserManager,
		private authService: AuthService) { }

	ngOnInit() {
		this.isAuthorized = this.userManager.isAuthorized();
	}

	toRegistration() {
		this.router.navigate(["/signup"]);
	}

	toLogin() {
		this.router.navigate(["/login"]);
	}

	toLayout() {
		this.verifySubscription = this.authService
			.verify()
			.subscribe({
				next: () =>  this.router.navigate(["/app"]),
				error: (_) => { 
					this.router.navigate(["/login"]); 
					this.userManager.clearUserData();
				} 
			});
	}

	ngOnDestroy(): void {
		this.verifySubscription.unsubscribe();
	}
}
