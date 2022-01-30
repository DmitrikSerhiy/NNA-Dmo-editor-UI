import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';

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
	private notExistingEmailValidation: string;
	private invalidEmailValidation: string;

	private mailSubscription: Subscription;
	reason: string;
	validReason: boolean = true;



  	constructor(
		  	private router: Router,
			private route: ActivatedRoute,
			private authService: AuthService) {
		this.invalidEmailValidation = "Email is invalid";
		this.emtpyEmailValidation = "Email is missing";
		this.notExistingEmailValidation = "Email is not found";
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

		this.reason = this.route.snapshot.queryParamMap.get("reason");
		if (this.reason == 'new' || this.reason == 'reset') {
			this.validReason = true;
		} else {
			this.validReason = false;
		}
    }

	navigateBack() {
		history.back()
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
			// ...
		}
	}


	ngOnDestroy(): void {
		if (this.mailSubscription) {
			this.mailSubscription.unsubscribe();
		}
	}

}
