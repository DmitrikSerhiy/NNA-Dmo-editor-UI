import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleLoginProvider, SocialAuthService } from 'angularx-social-login';
import { AuthGoogleDto } from '../../models/authDto';
import { ToastrErrorMessage } from '../../models/serverResponse';
import { AuthService } from '../../services/auth.service';
import { Toastr } from '../../services/toastr.service';
import { UserManager } from '../../services/user-manager';

@Component({
	selector: 'app-sso-container',
	templateUrl: './sso-container.component.html',
	styleUrls: ['./sso-container.component.scss']
})
export class SsoContainerComponent implements OnInit {

	@Input() isRegister: boolean;
	@Output() ssoButtonClicked = new EventEmitter<string>();
	isTextForSignUp: boolean;
	isSsoButtonClicked = false;

  	constructor(
		private sosialAuthService: SocialAuthService,
		public router: Router,
		private authService: AuthService,
		private toast: Toastr,
		private userManager: UserManager) { }

  	ngOnInit(): void {
		this.isTextForSignUp = this.isRegister;
	}

  	async onGoogleAuth($event: any) {
		$event.preventDefault();

		if (this.isSsoButtonClicked == true) {
			return;
		}
		this.isSsoButtonClicked = true;
		this.ssoButtonClicked.emit("google");

		try {
			var authResult = await this.sosialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
		} catch {
			this.isSsoButtonClicked = false;
			return;
		}
	  	if (!authResult) {
			this.toast.error(new ToastrErrorMessage("Google refused to authenticate your account", "Authentication failed"));
			this.isSsoButtonClicked = false;
			return;
	  	}

		let authGoogleDto: AuthGoogleDto = {
			name: authResult.name,
			email: authResult.email, 
			googleToken: authResult.idToken
		};

		try {
			let apiAuthResponse = await this.authService.googleAuth(authGoogleDto);
			this.userManager.saveUserData(apiAuthResponse.accessToken, apiAuthResponse.email, apiAuthResponse.userName, apiAuthResponse.refreshToken);
			this.isSsoButtonClicked = false;
			this.router.navigateByUrl('/app');
		} catch(error) {
			this.isSsoButtonClicked = false;
		}

 	}
}
