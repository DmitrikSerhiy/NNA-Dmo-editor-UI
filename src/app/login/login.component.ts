import { Toastr } from './../shared/services/toastr.service';
import { UserManager } from '../shared/services/user-manager';
import { AuthService } from './../shared/services/auth.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  @ViewChild('emailInpup', { static: true }) emailInput: ElementRef;
  @ViewChild('passwordInput', { static: true }) passwordInput: ElementRef;
  
  firstStep: boolean
  
  emailInvalid: boolean;
  passwordInvalid: boolean;

  private notExistingEmailValidation: string;
  private invalidEmailValidation: string;
  private emtpyEmailValidation: string;
  private emtpyPasswordValidation: string;
  private invalidPasswordValidation: string;
  private failedToAuthDueToWrongPassValidation: string;

  emailValidationToShow: string;
  passValidationToShow: string;

  constructor(
	public router: Router,
	private authService: AuthService,
	private userManager: UserManager,
	private toast: Toastr) {
	  this.notExistingEmailValidation = "Email is not found";
	  this.invalidEmailValidation = "Email is invalid";
	  this.emtpyEmailValidation = "Email is missing";
	  this.emtpyPasswordValidation = "Password is missing";
	  this.invalidPasswordValidation = "Password must be at least 8 characters long";
	  this.failedToAuthDueToWrongPassValidation = "Password is not correct";
  }

  ngOnInit() {
	this.firstStep = true;
	this.emailInvalid = false;
	this.passwordInvalid = false;

	this.loginForm = new FormGroup({
	  'email': new FormControl('', [Validators.required, Validators.email]),
	  'password': new FormControl('', [Validators.required, Validators.minLength(8)])
	});

	this.emailInput.nativeElement.focus();
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
  }


	toFirstStep(): void {
		location.href="login#email-input";
		this.firstStep = true;
		this.emailInput.nativeElement.focus();
	}

  	async toSecondStep() {
		let errors = this.loginForm.get('email').errors;
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
		
		let response = await this.authService.checkUserEmail(this.loginForm.get('email').value)
		if (response == false) {
			this.emailInvalid = true;
			this.emailValidationToShow = this.notExistingEmailValidation;
			this.emailInput.nativeElement.focus();
		} else {
			if (this.emailInvalid == true) {
				this.emailInvalid = false;
				await this.sleep(200);
			}

			location.href = "login#password-input";
			this.firstStep = false;
			this.emailInvalid = false;
			await this.sleep(600);
			this.passwordInput.nativeElement.focus();
		}
    }

  onSubmit() {
	let errors = this.loginForm.get('password').errors;
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
	  this.authService.authenticate(this.loginForm.get('email').value, this.loginForm.get('password').value)
		.subscribe((response) => {
		  if (response.errorMessage != null) {
			if (response.errorMessage == '403') {
			  this.passValidationToShow = this.failedToAuthDueToWrongPassValidation;
			  this.passwordInvalid = true;
			  this.passwordInput.nativeElement.focus();
			}
		  }
		  else {
			this.passwordInvalid = false;
			this.userManager.login(response.accessToken, response.email, response.userName);
		  }
		},
		(error) => {
		  this.toast.error(error);
		});
	}
  }

  private sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
  }
}
