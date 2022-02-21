import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { PersonalInfoDto } from 'src/app/shared/models/authDto';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserManager } from 'src/app/shared/services/user-manager';

@Component({
	selector: 'app-user-cabinet',
	templateUrl: './user-cabinet.component.html',
	styleUrls: ['./user-cabinet.component.scss']
})
export class UserCabinetComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input() rightMenuIsClosing$: Observable<void>;
	@Input() rightMenuIsOpening$: EventEmitter<void>;
	@Output() closeRightMenu = new EventEmitter<void>();
	@Output() updateUserName = new EventEmitter<void>();
	rightMenuOpnSubscription: Subscription;
	rightMenuClsSubscription: Subscription;
	isFormProcessing = false;
	showUserNameChangeForm: boolean = false;
	initialUserName: string;
	isUserNotFound: boolean = false;

	changeUserNameForm: FormGroup;
	get userName() { return this.changeUserNameForm.get('userName'); }
	@ViewChild('email', { static: true }) email: ElementRef;
	@ViewChild('demoName', { static: true }) demoName: ElementRef;
	@ViewChild('userName', { static: true }) userNameElement: ElementRef;


	personalInfo: PersonalInfoDto;

 	private unsubscribe$: Subject<void> = new Subject();
  
	constructor(		
		private userManager: UserManager,
		private authService: AuthService,
		private router: Router) { }

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

	ngAfterViewInit(): void {
		
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
		this.authService.updateUserName(this.userName.value)
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
				} );
	}

	toggleChangeUserNameForm(show: boolean) {
		this.showUserNameChangeForm = !this.showUserNameChangeForm;

		if (show === true) {
			this.userName.setValue(this.initialUserName);
			setTimeout(() => {
				this.userNameElement.nativeElement.focus();
			}, 100);
		} else {
			this.resetName();
		}
	}

	ngOnDestroy(): void {
		this.resetName();
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
		this.rightMenuOpnSubscription?.unsubscribe();
		this.rightMenuClsSubscription?.unsubscribe();
	}

	private resetName(): void {
		this.changeUserNameForm.reset();
	}

}
