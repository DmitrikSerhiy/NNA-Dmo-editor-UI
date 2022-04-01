import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SendMailReason } from '../shared/models/serverResponse';
import { AuthService } from '../shared/services/auth.service';
import { NnaHelpersService } from '../shared/services/nna-helpers.service';
import { UserManager } from '../shared/services/user-manager';

@Component({
  selector: 'app-mail-form',
  templateUrl: './mail-form.component.html',
  styleUrls: ['./mail-form.component.scss']
})
export class MailFormComponent implements OnInit, OnDestroy, AfterViewInit {

 	mailForm: FormGroup;
	get email() { return this.mailForm.get('email'); }
  	@ViewChild('emailInpup', { static: false }) emailInpup: ElementRef;

  	emailInvalid: boolean;
	emailValidationToShow: string;


	private emtpyEmailValidation: string;
	private invalidEmailValidation: string;
	isProcessing: boolean = false;

	private mailSubscription: Subscription;
	reason: string;
	validReason: boolean = true;
	isSent: boolean = false;
	isNotSent: boolean = true;
	sentCompleted: boolean = false;

  	constructor(
		  	private router: Router,
			private route: ActivatedRoute,
			private authService: AuthService,
			private nnaHelpersService: NnaHelpersService,
			private userManager: UserManager) {
		this.invalidEmailValidation = "Email is invalid";
		this.emtpyEmailValidation = "Email is missing";
	}

	ngAfterViewInit(): void {
		if (this.reason && this.validReason) {
			this.emailInpup.nativeElement.focus();
		}
	}

  	ngOnInit(): void {
    	this.emailInvalid = false;
      	this.mailForm = new FormGroup({
        	'email': new FormControl('', [Validators.required, Validators.email])
		});

		if (this.userManager.isAuthorized()) {
			this.email.setValue(this.userManager.getCurrentUserEmail());
		}

		this.reason = this.route.snapshot.queryParamMap.get("reason");
		if (this.reason == 'new' || this.reason == 'reset') {
			this.validReason = true;
		} else {
			this.validReason = false;
		}
    }

	navigateBack() {
		if (this.userManager.isAuthorized) {
			history.back();
		} else {
			this.router.navigate(['/login']);
		}
	}

	redirectToHome() {
		this.router.navigate(['/app']);
	}

	checkKey($event) {
		let key = $event.which || $event.keyCode || $event.charCode;
		if (key == 13 || key == 9) {
			$event.preventDefault();
		}
	}

	specialTrigger($event) {
		let key = $event.which || $event.keyCode || $event.charCode;

		if (key == 13 || key == 9) { // enter or tab
			$event.preventDefault();
			this.onSubmit();
		}
	}
  
	onSubmit() {
		let errors = this.email.errors;
		if (errors != null) {
			this.emailInvalid = true;
			if (errors['email']) {
				this.emailValidationToShow = this.invalidEmailValidation;
				this.emailInpup.nativeElement.focus();
			} else if (errors['required']) {
				this.emailValidationToShow = this.emtpyEmailValidation;
				this.emailInpup.nativeElement.focus();
			}
			return;
		}

		if (this.mailForm.valid) {
			this.isProcessing = true;
			const sendMail$ = this.reason == 'new' 
				? this.authService.sendMail(this.email.value, SendMailReason.setPassword)
				: this.authService.sendMail(this.email.value, SendMailReason.resetPassword);

			this.mailSubscription = sendMail$.subscribe(
				(isSuccess: boolean) => {
					if (isSuccess) {
						this.isSent = true;
						this.isNotSent = false;
					} else {
						this.isNotSent = true;
						this.isSent = false;
					}
					this.sentCompleted = true;
					this.isProcessing = false;
				});
		}
	}

	async resetForm() {
		this.mailSubscription?.unsubscribe();
		this.isProcessing = false;
		this.isSent = false;
		this.isNotSent = true;
		this.sentCompleted = false;
		this.mailForm.reset();
		this.emailInvalid = false;

		if (this.userManager.isAuthorized()) {
			this.email.setValue(this.userManager.getCurrentUserEmail());
		}

		await this.nnaHelpersService.sleep(200);
		this.emailInpup.nativeElement.focus();
	}

	ngOnDestroy(): void {
		this.mailSubscription?.unsubscribe();
	}

}
