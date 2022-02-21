import { UserManager } from '../shared/services/user-manager';
import { AuthService } from './../shared/services/auth.service';
import { Component, ElementRef, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Toastr } from '../shared/services/toastr.service';
import { Subscription } from 'rxjs';
import { NnaHelpersService } from '../shared/services/nna-helpers.service';

@Component({
	selector: 'app-signup',
	templateUrl: './signup.component.html',
	styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy {

	registerForm: FormGroup;
	get name() { return this.registerForm.get('new-name'); }
	get email() { return this.registerForm.get('new-email'); }
	get password() { return this.registerForm.get('new-password'); }

	@ViewChild('emailInpup', { static: true }) emailInput: ElementRef;
	@ViewChild('passwordInput', { static: true }) passwordInput: ElementRef;
	@ViewChild('nameInpup', { static: true }) nameInput: ElementRef;

	firstStep: boolean
	secondStep: boolean;
	thirdStep: boolean;

	emailInvalid: boolean;
	passwordInvalid: boolean;
	nameInvalid: boolean;

	private invalidEmailValidation: string;
	private emtpyEmailValidation: string;
	private takenEmailValidaiton: string;
	private emtpyNameValidation: string;
	private takenNameValidaiton: string;
	private emtpyPasswordValidation: string;
	private invalidPasswordValidation: string;
	private failureMessage: string;
	private nonAllowedSymbols: string;

	passwordHidden: boolean = true;
	emailValidationToShow: string;
	nameValidationToShow: string;
	passValidationToShow: string;

	private registerSubscriptions: Subscription;

  	constructor(
		public router: Router,
		private authService: AuthService,
		private userManager: UserManager,
		private toast: Toastr,
		private nnaHelpersService: NnaHelpersService) { 
		this.invalidEmailValidation = "Email is invalid";
		this.emtpyEmailValidation = "Email is missing";
		this.takenEmailValidaiton = "Email is already taken";
		this.emtpyNameValidation = "Name is missing";
		this.takenNameValidaiton = "Name is already taken";
		this.emtpyPasswordValidation = "Password is missing";
		this.invalidPasswordValidation = "Password must be at least 10 characters long";
		this.failureMessage = 'Failed to create user';
		this.nonAllowedSymbols = "Non-allowed symbols detected";
	}

  	ngOnInit() {
		this.firstStep = true;
		this.secondStep = false;
		this.thirdStep = false;

		this.emailInvalid = false;
		this.passwordInvalid = false;
		this.nameInvalid = false;

		this.registerForm = new FormGroup({
			'new-name' : new FormControl('', [Validators.required, Validators.maxLength(50)]),
			'new-email': new FormControl('', [Validators.required, Validators.email]),
			'new-password': new FormControl('', [Validators.required, Validators.minLength(10)])
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

	async specialTrigger($event, step: number) {
		let key = $event.which || $event.keyCode || $event.charCode;
		if (key == 13 || key == 9) { // enter or tab
			$event.preventDefault();
			if (step == 1) {
				this.toSecondStep();
				return;
			} else if (step == 2) {
				await this.toThirdStep()
				return;
			} else if (step == 3) {
				this.onSubmit();
				return;
			}
		}

		if (step == 3) {
			if (this.nnaHelpersService.containsNonAllowedSymbols(this.password.value)) {
				this.passValidationToShow = this.nonAllowedSymbols;
				this.passwordInvalid = true;
				this.passwordInput.nativeElement.focus();
			} else {
				this.passwordInvalid = false;
			}
		}
	}

	toFirstStep(): void {
		location.href="signup#email-input";
		this.firstStep = true;
		this.secondStep = false;
		this.thirdStep = false;
		this.emailInput.nativeElement.focus();
	}

	async toSecondStep(skipValidation: boolean = false): Promise<void> {
		if (skipValidation == true) {
			location.href = "signup#name-input";
			this.firstStep = false;
			this.thirdStep = false;
			this.secondStep = true;
			this.emailInvalid = false;
			await this.nnaHelpersService.sleep(600);
			this.nameInput.nativeElement.focus();
			return;
		}

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
	  	if (response == true) {
			this.emailInvalid = true;
			this.emailValidationToShow = this.takenEmailValidaiton;
			this.emailInput.nativeElement.focus();
	 	} else {
			if (this.emailInvalid == true) {
				this.emailInvalid = false;
				this.thirdStep = false;
				await this.nnaHelpersService.sleep(200);
			}

			location.href = "signup#name-input";
			this.firstStep = false;
			this.thirdStep = false;
			this.secondStep = true;
			this.emailInvalid = false;
			await this.nnaHelpersService.sleep(600);
			this.nameInput.nativeElement.focus();
	  	}
  	}

	async toThirdStep(): Promise<void> {
		let errors = this.name.errors;
		if (errors != null) {
			this.nameInvalid = true;
		if (errors['required']) {
			this.nameValidationToShow = this.emtpyNameValidation;
			this.nameInput.nativeElement.focus();
		}
			return;
		}

		let response = await this.authService.checkName(this.name.value)
		if (response == true) {
			this.nameInvalid = true;
			this.nameValidationToShow = this.takenNameValidaiton;
			this.nameInput.nativeElement.focus();
		} else {
			if (this.nameInvalid == true) {
				this.nameInvalid = false;
				await this.nnaHelpersService.sleep(200);
			}

			location.href = "signup#password-input";
			this.firstStep = false;
			this.secondStep = false;
			this.thirdStep = true;
			this.emailInvalid = false;
			await this.nnaHelpersService.sleep(600);
			this.passwordInput.nativeElement.focus();
		}
  	}

  	onSubmit() {
		if (this.nnaHelpersService.containsNonAllowedSymbols(this.password.value)) {
			this.passValidationToShow = this.nonAllowedSymbols;
			this.passwordInvalid = true;
			this.passwordInput.nativeElement.focus();
			return;
		} else {
			this.passwordInvalid = false;
		}

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
		if (this.registerForm.valid) {
			this.registerSubscriptions = this.authService
				.register(this.name.value, this.email.value, this.password.value)
				.subscribe(
					(response) => {
						this.emailInvalid = false;
						this.passwordInvalid = false;
						this.nameInvalid = false;
						this.userManager.saveUserData(response.accessToken, response.email, response.userName, response.refreshToken);
						this.router.navigateByUrl('/app');
					}, 
					(errorMessage) => {
						this.passValidationToShow = errorMessage.title;
						this.passwordInvalid = true;
						this.passwordInput.nativeElement.focus();
					}
				);
		}
 	}

	ssoButtonClicked(authProviderName: string) {
		location.href="signup#email-input";
		this.firstStep = true;
		this.secondStep = false;
		this.thirdStep = false;
		this.registerForm.reset();
		this.emailInvalid = false;
		this.passwordInvalid = false;
		this.nameInvalid = false;
	}

	ngOnDestroy(): void {
		this.registerSubscriptions?.unsubscribe();
	}
}
