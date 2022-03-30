import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PersonalInfoDto } from 'src/app/shared/models/authDto';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserManager } from 'src/app/shared/services/user-manager';

@Component({
	selector: 'app-user-cabinet',
	templateUrl: './user-cabinet.component.html',
	styleUrls: ['./user-cabinet.component.scss']
})
export class UserCabinetComponent implements OnInit, OnDestroy {

	@Input() rightMenuIsClosing$: Observable<void>;
	@Input() rightMenuIsOpening$: EventEmitter<void>;
	@Output() closeRightMenu = new EventEmitter<void>();
	@Output() updateUserName = new EventEmitter<void>();
	rightMenuOpnSubscription: Subscription;
	rightMenuClsSubscription: Subscription;
	isFormProcessing = false;
	showUserNameChangeForm: boolean = false;
	showPasswordChangeForm: boolean = false;
	initialUserName: string;
	isUserNotFound: boolean = false;
	passwordHidden: boolean = true;

	missingPasswordValidation: boolean = false;
	missingNewPasswordValidation: boolean = false;
	minLenghtPasswordValidation: boolean = false;

	changeUserNameForm: FormGroup;
	changePasswordForm: FormGroup;
	get userName() { return this.changeUserNameForm.get('userName'); }

	@ViewChild('email', { static: true }) email: ElementRef;
	@ViewChild('demoName', { static: true }) demoName: ElementRef;
	@ViewChild('userName', { static: true }) userNameElement: ElementRef;

	@ViewChild('oldPasswordInput', { static: true }) oldPasswordElement: ElementRef;
	@ViewChild('newPasswordInput', { static: true }) newPasswordElement: ElementRef;

	showPasswordTitle: string;
	hidePasswordTitle: string;
	passwrodTogglerTitle: string;

	// todo: userName must be trimmed and left with single space only
	personalInfo: PersonalInfoDto;

 	private unsubscribe$: Subject<void> = new Subject();
  
	constructor(		
		private userManager: UserManager,
		private authService: AuthService,
		private router: Router) { 
			this.showPasswordTitle = "Show password";
			this.hidePasswordTitle = "Hide password";
			this.passwrodTogglerTitle = this.showPasswordTitle;
		}

	ngOnInit(): void {
		this.rightMenuClsSubscription = this.rightMenuIsClosing$.subscribe(() => {
			// do some shit on close menu
		});
		this.rightMenuOpnSubscription = this.rightMenuIsOpening$.subscribe(() => {
			// do some shit on open menu
		})

		this.changeUserNameForm = new FormGroup({
			'userName': new FormControl('', [Validators.required, Validators.maxLength(50)])
		});

		this.changePasswordForm = new FormGroup({
			'oldPassword': new FormControl('', [Validators.required]),
			'newPassword': new FormControl('', [Validators.required, Validators.minLength(10)])
		});
		
		this.isFormProcessing = true;
		this.authService
			.getPersonalInfo()
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(	
				(response: PersonalInfoDto) => { 
					if (!response) {
						this.isFormProcessing = false;
						this.isUserNotFound = true;
						return;
					}
					this.personalInfo = response;

					this.userName.setValue(this.personalInfo.userName);
					this.email.nativeElement.value = this.personalInfo.userEmail;
					this.demoName.nativeElement.value = this.personalInfo.userName;
					this.initialUserName = this.personalInfo.userName;


					this.isFormProcessing = false;
				},
				() => { 
					this.isFormProcessing = false;
				}
			);
	}

	togglePassword() {
		this.passwordHidden = !this.passwordHidden;

		this.passwrodTogglerTitle = this.passwordHidden 
			? this.showPasswordTitle
			: this.hidePasswordTitle;

		this.passwordHidden 
			? this.oldPasswordElement.nativeElement.setAttribute('type', 'password')
			: this.oldPasswordElement.nativeElement.setAttribute('type', 'text');

		this.passwordHidden 
			? this.newPasswordElement.nativeElement.setAttribute('type', 'password')
			: this.newPasswordElement.nativeElement.setAttribute('type', 'text');
	}

	redirectToSetPasswordPage() {
		this.router.navigate(['/email'], { queryParams: { reason: 'new' } } );
	}

	sendVerifyEmail() {
		console.log("not implemented");
	}

	onLoggedout() {
    	this.authService
			.logout()
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(_ => {
					this.userManager.clearUserData();
					this.router.navigate(['/'])
				}
			);
  	}

	onUserNameChange() {
		if (this.userName.value === this.initialUserName) {
			this.toggleChangeUserNameForm(false);
			return;
		}

		if (this.changeUserNameForm.invalid) {
			this.toggleChangeUserNameForm(false);
			return;
		}
		
		this.isFormProcessing = true;
		this.authService
			.updateUserName(this.userName.value)
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(
				(changeNameResponse: boolean) => {
					if (changeNameResponse) {
						this.initialUserName = this.userName.value;
						this.personalInfo.userName = this.userName.value;
						this.demoName.nativeElement.value = this.userName.value;
						this.userManager.updateUserName(this.userName.value);
						this.updateUserName.emit();
						this.toggleChangeUserNameForm(false);
					}
					this.isFormProcessing = false;
				},
				() => { 
					this.toggleChangeUserNameForm(false);
					this.isFormProcessing = false;
				} 
			);
	}


	onPasswordChange() {
		if (!this.changePasswordForm.valid) {
			this.missingPasswordValidation = this.changePasswordForm.controls["oldPassword"].errors?.required ? true : false;
			this.missingNewPasswordValidation = this.changePasswordForm.controls["newPassword"].errors?.required ? true : false;
			this.minLenghtPasswordValidation = this.changePasswordForm.controls["newPassword"].errors?.minlength ? true : false;
		} else {
			this.missingPasswordValidation = false;
			this.missingNewPasswordValidation = false;
			this.minLenghtPasswordValidation = false;
		}

		if (!this.changePasswordForm.valid) {
			return;
		}

		// todo: send request

	}

	toggleChangeUserNameForm(show: boolean, hideOtherForms: boolean = true) {
		this.showUserNameChangeForm = show;
		this.userName.setValue(this.initialUserName);

		if (show === true) {	
			setTimeout(() => {
				this.userNameElement.nativeElement.focus();
			}, 100);
		} else {
			this.resetNameForm();
		}

		if (hideOtherForms) {
			this.toggleChangePasswordForm(false, false);
		}
	}

	toggleChangePasswordForm(show: boolean, hideOtherForms: boolean = true) {
		this.showPasswordChangeForm = show;

		if (show === true) {	
			setTimeout(() => {
				this.oldPasswordElement.nativeElement.focus();
			}, 100);
		} else {
			this.resetPasswordForm();
		}

		if (hideOtherForms) {
			this.toggleChangeUserNameForm(false, false);
		}
	}



	ngOnDestroy(): void {
		this.resetNameForm();
		this.resetPasswordForm();
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
		this.rightMenuOpnSubscription?.unsubscribe();
		this.rightMenuClsSubscription?.unsubscribe();
	}

	private resetNameForm(): void {
		this.changeUserNameForm.reset();
	}

	private resetPasswordForm(): void {
		this.passwrodTogglerTitle = this.showPasswordTitle;
		this.passwordHidden = true;
		this.changePasswordForm.reset();
	}

}
