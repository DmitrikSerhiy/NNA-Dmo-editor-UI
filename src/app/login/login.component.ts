import { Toastr } from './../shared/services/toastr.service';
import { UserManager } from '../shared/services/user-manager';
import { AuthService } from './../shared/services/auth.service';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NnaHelpersService } from '../shared/services/nna-helpers.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

	loginForm: FormGroup;
	get email() { return this.loginForm.get('email'); }
	get password() { return this.loginForm.get('password'); }

	@ViewChild('emailInpup', { static: true }) emailInput: ElementRef;
	@ViewChild('passwordInput', { static: true }) passwordInput: ElementRef;
	
	firstStep: boolean
	
	emailInvalid: boolean;
	passwordInvalid: boolean;
	
	private loginSubscription: Subscription;
	private notExistingEmailValidation: string;
	private invalidEmailValidation: string;
	private emtpyEmailValidation: string;
	private emtpyPasswordValidation: string;
	private invalidPasswordValidation: string;
	private failedToAuthDueToWrongPassValidation: string;
	private ssoEmailValidationHeaderToShow: string
	private ssoEmailValidationToShow: string;
	private nonEnglishCurrentLanguage: string;
	
	additionalValidationForSsoEmail: string;
	linkToSetPasswordTitle: string;
	linkToSetPasswordPreTitle: string;
	linkToSetPasswordPostTitle: string;
	emailValidationToShow: string;
	passValidationToShow: string;
	showPasswordTitle: string
	hidePasswordTitle: string;
	passwordHidden: boolean = true;

	constructor(
		public router: Router,
		private authService: AuthService,
		private userManager: UserManager,
		private toast: Toastr,
		private nnaHelpersService: NnaHelpersService) {

		this.notExistingEmailValidation = "Email is not found";
		this.ssoEmailValidationHeaderToShow = "Password is not set for this email";
		this.invalidEmailValidation = "Email is invalid";
		this.emtpyEmailValidation = "Email is missing";
		this.emtpyPasswordValidation = "Password is missing";
		this.invalidPasswordValidation = "Password must contain at least 10 symbols";
		this.failedToAuthDueToWrongPassValidation = "Password is not correct";
		this.ssoEmailValidationToShow = "Use your social account to login"
		this.linkToSetPasswordPreTitle = "Or ";
		this.linkToSetPasswordTitle = "set password";
		this.linkToSetPasswordPostTitle = "manually";
		this.nonEnglishCurrentLanguage = "Non-English symbols are not allowed";
		this.showPasswordTitle = "Show password";
		this.hidePasswordTitle = "Hide password";
	}


  	ngOnInit() {
		this.firstStep = true;
		this.emailInvalid = false;
		this.passwordInvalid = false;

		this.loginForm = new FormGroup({
			'email': new FormControl('', [Validators.required, Validators.email]),
			'password': new FormControl('', [Validators.required, Validators.minLength(10)])
		});

		this.emailInput.nativeElement.focus();

  	}

	togglePassword(toggler: boolean) {
		this.passwordHidden = toggler;

		this.passwordHidden 
			? this.passwordInput.nativeElement.setAttribute('type', 'password')
			: this.passwordInput.nativeElement.setAttribute('type', 'text');

		this.passwordInput.nativeElement.focus();
	}

	redirectToHome() {
		this.router.navigate(['/']);
	}
  
	checkKey($event) {
		let key = $event.which || $event.keyCode || $event.charCode;
		if (key == 13 || key == 9) {
			$event.preventDefault();
		}
	}

	async specialTrigger($event, secondStep: boolean) {
		let key = $event.which || $event.keyCode || $event.charCode;

		if (key == 13 || key == 9) { // enter or tab
			$event.preventDefault();
			if (secondStep == true) {
				await this.toSecondStep();
			} else if (secondStep == false) {
				this.onSubmit();
			}
		}

		if (secondStep == false) {
			if (this.nnaHelpersService.containsNonEnglishSymbols(this.password.value)) {
				this.passValidationToShow = this.nonEnglishCurrentLanguage;
				this.passwordInvalid = true;
				this.passwordInput.nativeElement.focus();
			} else {
				this.passwordInvalid = false;
			}
		}
	}


	toFirstStep(): void {
		location.href="login#email-input";
		this.firstStep = true;
		this.emailInput.nativeElement.focus();
	}

  	async toSecondStep() {
		let errors = this.email.errors;
		if (errors != null) {
			this.emailInvalid = true;
			if (errors['email']) {
				this.emailValidationToShow = this.invalidEmailValidation;
				this.emailInput.nativeElement.focus();
			} else if (errors['required']) {
				this.emailValidationToShow = this.emtpyEmailValidation;
				this.emailInput.nativeElement.focus();
			}
			return;
		} 
		
		let response = await this.authService.checkUserEmail(this.email.value);
		if (response == false) {
			this.emailInvalid = true;
			this.additionalValidationForSsoEmail = '';
			this.emailValidationToShow = this.notExistingEmailValidation;
			this.emailInput.nativeElement.focus();
		} else {
			if (this.emailInvalid == true) {
				this.emailInvalid = false;
			}
			let ssoResponse = await this.authService.checkSsoAndPassword(this.email.value);
			if (ssoResponse) {
				this.emailInvalid = true;
				this.emailValidationToShow = this.ssoEmailValidationHeaderToShow;
				this.additionalValidationForSsoEmail = this.ssoEmailValidationToShow.replace("social", ssoResponse.charAt(0).toUpperCase() + ssoResponse.substring(1, ssoResponse.length));
				this.emailInput.nativeElement.focus();
				return;
			} 
			
			this.additionalValidationForSsoEmail = '';
			this.emailValidationToShow = '';
			this.emailInvalid = false;
			await this.nnaHelpersService.sleep(200);
			location.href = "login#password-input";
			this.firstStep = false;
			await this.nnaHelpersService.sleep(600);
			this.passwordInput.nativeElement.focus();
		}
    }

  	onSubmit() {
		let errors = this.password.errors;
		if (errors != null) {
			this.passwordInvalid = true;
		if (errors['required']) {
			this.passValidationToShow = this.emtpyPasswordValidation;
			this.passwordInput.nativeElement.focus();
		} else if (errors['minlength']) {
			this.passValidationToShow = this.invalidPasswordValidation;
			this.passwordInput.nativeElement.focus();
		};
			return;
		} 

		if (this.loginForm.valid) {
			this.loginSubscription = this.authService
				.authenticate(this.email.value, this.password.value)
				.subscribe((response) => {
				if (response.errorMessage != null) {
					if (response.errorMessage == '422') {
						this.passValidationToShow = this.failedToAuthDueToWrongPassValidation;
						this.passwordInvalid = true;
						this.passwordInput.nativeElement.focus();
					}
				} else {
					this.passwordInvalid = false;
					this.userManager.saveUserData(response.accessToken, response.email, response.userName, response.refreshToken);
					this.router.navigateByUrl('/app');
				}
			},
			(error) => {
				this.toast.error(error);
			});
		}
	}

	ngOnDestroy(): void {
		if (this.loginSubscription) {
			this.loginSubscription.unsubscribe();
		}
	}
}
