import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SendMailReason } from '../shared/models/serverResponse';
import { AuthService } from '../shared/services/auth.service';
import { NnaHelpersService } from '../shared/services/nna-helpers.service';
import { Toastr } from '../shared/services/toastr.service';
import { UserManager } from '../shared/services/user-manager';

@Component({
	selector: 'app-password',
	templateUrl: './password.component.html',
	styleUrls: ['./password.component.scss']
})
export class PasswordComponent implements OnInit, OnDestroy, AfterViewInit {

	passwordForm: FormGroup;
	get password() { return this.passwordForm.get('password'); }
  	@ViewChild('passwordInput', { static: false }) passwordInput: ElementRef;

	passwordInvalid: boolean;
	passValidationToShow: string;
	showPasswordTitle: string
	hidePasswordTitle: string;
	passwordHidden: boolean = true;

	private nonEnglishCurrentLanguage: string;
	private invalidPasswordValidation: string;
	private emtpyPasswordValidation: string;
	private failedToAuthDueToWrongPassValidation: string;

	private email: string;
	private reason: SendMailReason;
	private token: string;

	isProcessing: boolean = false;

	private passwordSubscription: Subscription;
	private validateMailAndTokenSubscription: Subscription;
	private loginSubscription: Subscription;
	private invalidToken: string; 
	private failedToValidate: string;
	allowToSetOrResetPassword: boolean = false;

  	constructor(		
		public router: Router,
		private route: ActivatedRoute,
		private authService: AuthService,
		private userManager: UserManager,
		private toast: Toastr,
		private nnaHelpersService: NnaHelpersService) {
		
		this.emtpyPasswordValidation = "Password is missing";
		this.invalidPasswordValidation = "Password must contain at least 10 symbols";
		this.nonEnglishCurrentLanguage = "Non-English symbols are not allowed";
		this.failedToAuthDueToWrongPassValidation = "Password is not correct";
		this.showPasswordTitle = "Show password";
		this.hidePasswordTitle = "Hide password";
		this.invalidToken = "Token invalid. Try again."
		this.failedToValidate = "Failed to validate token. Try again";
   	}

	ngAfterViewInit(): void {
		if (this.email && (this.reason == 0 || this.reason == 1) && this.token) {
			if (this.isProcessing == false) {
				this.passwordInput.nativeElement.focus();
			}
		}
	}

	ngOnInit(): void {
		this.passwordInvalid = false;
		this.email = this.route.snapshot.queryParamMap.get("user");
		this.reason = +this.route.snapshot.queryParamMap.get("reason") as SendMailReason;
		this.token = this.route.snapshot.queryParamMap.get("token");

		this.passwordForm = new FormGroup({
        	'password': new FormControl('', [Validators.required, Validators.minLength(10)])
		});
		this.isProcessing = true;

		this.validateMailAndTokenSubscription = this.authService.validateMailAndToken(this.email, this.token, this.reason)
			.subscribe((result: any) => { 
				this.allowToSetOrResetPassword = result.valid;

				if (!this.allowToSetOrResetPassword) {
					this.password.disable();
				} else {
					this.password.enable();
				}
				
				if (!result.valid) {
					this.passValidationToShow = this.invalidToken;
					this.passwordInvalid = true;
				} else {
					this.passwordInvalid = false;
				}
				this.isProcessing = false;
			}, () => { 
				this.passValidationToShow = this.failedToValidate;
				this.passwordInvalid = true;
				this.allowToSetOrResetPassword = false;
				this.password.disable();
				this.isProcessing = false;
			});
	}

	togglePassword(toggler: boolean) {
		if (!this.allowToSetOrResetPassword) {
			return;
		}
		this.passwordHidden = toggler;

		this.passwordHidden 
			? this.passwordInput.nativeElement.setAttribute('type', 'password')
			: this.passwordInput.nativeElement.setAttribute('type', 'text');

		this.passwordInput.nativeElement.focus();
	}

	redirectToHome() {
		this.router.navigate(['/']);
	}

	navigateToMail() {
		const reasonParam = this.reason === 0
			? 'new'
			: 'reset';

		this.router.navigate(['/email'], { queryParams: { reason: reasonParam } } );
	}

	checkKey($event) {
		let key = $event.which || $event.keyCode || $event.charCode;
		if (key == 13 || key == 9) {
			$event.preventDefault();
		}
	}
	
	async specialTrigger($event) {
		let key = $event.which || $event.keyCode || $event.charCode;

		if (key == 13 || key == 9) { // enter or tab
			$event.preventDefault();
			this.onSubmit();
			return;
		}

		if (this.nnaHelpersService.containsNonEnglishSymbols(this.password.value)) {
			this.passValidationToShow = this.nonEnglishCurrentLanguage;
			this.passwordInvalid = true;
			this.passwordInput.nativeElement.focus();
		} else {
			this.passwordInvalid = false;
		}
	}

	onSubmit() {
		if (this.nnaHelpersService.containsNonEnglishSymbols(this.password.value)) {
			this.passValidationToShow = this.nonEnglishCurrentLanguage;
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

		if (this.passwordForm.valid) {
			this.isProcessing = true;
			this.passwordSubscription = this.authService
				.setOrResetPassword(this.email, this.token, this.reason, this.password.value)
				.subscribe((response) => {
					if (response?.errorMessage != null) {
						if (response.errorMessage == '422') {
							this.passValidationToShow = this.failedToAuthDueToWrongPassValidation;
							this.passwordInvalid = true;
							this.isProcessing = false;
							this.passwordInput.nativeElement.focus();
						}
					} else {
						console.log('hello');
						this.passwordInvalid = false;
						this.loginSubscription = this.authService
							.authenticate(this.email, this.password.value)
							.subscribe((response) => {
								this.userManager.saveUserData(response.accessToken, response.email, response.userName, response.refreshToken);
								this.isProcessing = false;
								this.router.navigateByUrl('/app');
							});
					}
				},
				(error) => {
					this.isProcessing = false;
					this.toast.error(error);
				});
		}
	}


	ngOnDestroy(): void {
		if (this.passwordSubscription) {
			this.passwordSubscription.unsubscribe();
		}

		if (this.validateMailAndTokenSubscription) {
			this.validateMailAndTokenSubscription.unsubscribe();
		}

		if (this.loginSubscription) {
			this.loginSubscription.unsubscribe();
		}
	}
}