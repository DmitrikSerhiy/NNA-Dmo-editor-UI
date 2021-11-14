import { UserManager } from '../shared/services/user-manager';
import { AuthService } from './../shared/services/auth.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Toastr } from '../shared/services/toastr.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  registerForm: FormGroup;
  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }

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

  emailValidationToShow: string;
  nameValidationToShow: string;
  passValidationToShow: string;

  constructor(
	public router: Router,
	private authService: AuthService,
	private userManager: UserManager,
	private toast: Toastr) { 
	  this.invalidEmailValidation = "Email is invalid";
	  this.emtpyEmailValidation = "Email is missing";
	  this.takenEmailValidaiton = "Email is already taken";
	  this.emtpyNameValidation = "Name is missing";
	  this.takenNameValidaiton = "Name is already taken";
	  this.emtpyPasswordValidation = "Password is missing";
	  this.invalidPasswordValidation = "Password must be at least 10 characters long";
	  this.failureMessage = 'Failed to create user';
	}

  ngOnInit() {
	this.firstStep = true;
	this.secondStep = false;
	this.thirdStep = false;

	this.emailInvalid = false;
	this.passwordInvalid = false;
	this.nameInvalid = false;

	this.registerForm = new FormGroup({
	  'name' : new FormControl('', [Validators.required]),
	  'email': new FormControl('', [Validators.required, Validators.email]),
	  'password': new FormControl('', [Validators.required, Validators.minLength(10)])
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

  async specialTrigger($event, step: number) {
	let key = $event.which || $event.keyCode || $event.charCode;
	if (key == 13 || key == 9) { // enter or tab
	  $event.preventDefault();
	  if (step == 1) {
		this.toSecondStep();
	  } else if (step == 2) {
		await this.toThirdStep()
	  } else if (step == 3) {
		this.onSubmit();
	  }
	}
  }

  async toFirstStep(): Promise<void> {
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
	  await this.sleep(600);
	  this.nameInput.nativeElement.focus();
	  return;
	}

	let errors = this.registerForm.get('email').errors;
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

	let response = await this.authService.checkUserEmail(this.registerForm.get('email').value);
	  if (response == true) {
		this.emailInvalid = true;
		this.emailValidationToShow = this.takenEmailValidaiton;
		this.emailInput.nativeElement.focus();
	  } else {
		if (this.emailInvalid == true) {
		  this.emailInvalid = false;
		  this.thirdStep = false;
		  await this.sleep(200);
		}

		location.href = "signup#name-input";
		this.firstStep = false;
		this.thirdStep = false;
		this.secondStep = true;
		this.emailInvalid = false;
		await this.sleep(600);
		this.nameInput.nativeElement.focus();
	  }
  }

	async toThirdStep(): Promise<void> {
		let errors = this.registerForm.get('name').errors;
		if (errors != null) {
			this.nameInvalid = true;
		if (errors['required']) {
			this.nameValidationToShow = this.emtpyNameValidation;
			this.nameInput.nativeElement.focus();
		}
			return;
		}

		let response = await this.authService.checkName(this.registerForm.get('name').value)
		if (response == true) {
			this.nameInvalid = true;
			this.nameValidationToShow = this.takenNameValidaiton;
			this.nameInput.nativeElement.focus();
		} else {
			if (this.nameInvalid == true) {
				this.nameInvalid = false;
				await this.sleep(200);
			}

			location.href = "signup#password-input";
			this.firstStep = false;
			this.secondStep = false;
			this.thirdStep = true;
			this.emailInvalid = false;
			await this.sleep(600);
			this.passwordInput.nativeElement.focus();
		}
  	}

  onSubmit() {
	let errors = this.registerForm.get('password').errors;
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
	  	this.authService.register(this.registerForm.get('name').value, this.registerForm.get('email').value, this.registerForm.get('password').value)
			.subscribe((response) => {
				if (response.errorMessage != null) {
					if (response.errorMessage == '422') {
					  this.passValidationToShow = this.failureMessage;
					  this.passwordInvalid = true;
					  this.passwordInput.nativeElement.focus();
					}
				  }
				  else {
					this.emailInvalid = false;
					this.passwordInvalid = false;
					this.nameInvalid = false;
					this.userManager.register(response.accessToken, response.email, response.userName);
				  }
			},
			(error) => {
				this.toast.error(error);
			}
		);
	}
  }

  
  private sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
  }
}
