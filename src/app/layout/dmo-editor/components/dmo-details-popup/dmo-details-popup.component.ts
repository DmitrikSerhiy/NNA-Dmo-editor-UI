import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DmoDetailsDto, UpdateDmoDetailsDto  } from 'src/app/layout/models';
import { EditorHub } from '../../services/editor-hub.service';
import { compare } from 'fast-json-patch';


@Component({
	selector: 'app-dmo-details-popup',
	templateUrl: './dmo-details-popup.component.html',
	styleUrls: ['./dmo-details-popup.component.scss']
})
export class DmoDetailsPopupComponent implements OnInit {

	dmoDetailsForm: FormGroup;
	currentTabIndex: number = 0;
	private maxEntityNameLength = 100;
	private maxShortCommentLength = 500;
	
	private dmoDetails: DmoDetailsDto;
	private dmoId: string; 
	dmoIsLoaded: boolean = false;

	get dmoName() { return this.dmoDetailsForm.get('dmoNameInput'); }
	get movieTitle() { return this.dmoDetailsForm.get('movieTitleInput'); }
	get dmoStatus() { return this.dmoDetailsForm.get('dmoStatusInput'); }
	get shortComment() { return this.dmoDetailsForm.get('shortCommentInput'); }


	private maxNameLengthExceededValidationMessage: string;
	private maxMovieTitleLengthExceededValidationMessage: string;
	private maxShortCommentLengthExceededValidationMessage: string;
	private movieTitleMissingValidationMessage: string;
	dmoDetailsValidations: string[] = [];

	@HostListener('window:keydown', ['$event'])
	handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			this.onClose(false);
		}
	}

	constructor(
		private dialogRef: MatDialogRef<DmoDetailsPopupComponent>,
		private editorHub: EditorHub,
		@Inject(MAT_DIALOG_DATA) private data: string) {
			this.dmoId = data;
			this.maxNameLengthExceededValidationMessage = "Maximum name length exceeded";
			this.maxMovieTitleLengthExceededValidationMessage = "Maximum movie title length exceeded";
			this.maxShortCommentLengthExceededValidationMessage = "Maximum short comment length exceeded";
			this.movieTitleMissingValidationMessage = "Movie title is missing";
		}

	async ngOnInit(): Promise<void> {
		this.dmoDetails = await this.editorHub.getDmoDetails(this.dmoId);
		this.dmoIsLoaded = true;
		this.dialogRef.backdropClick().subscribe(() => this.onClose(true));
		this.dmoDetailsForm = new FormGroup({
			'dmoNameInput': new FormControl('', [Validators.maxLength(this.maxEntityNameLength)]),
			'movieTitleInput': new FormControl('', [Validators.required, Validators.maxLength(this.maxEntityNameLength)]),
			'dmoStatusInput': new FormControl(''),
			'shortCommentInput': new FormControl('',  [Validators.maxLength(this.maxShortCommentLength)])
		});

		this.setDmoDetailsValues();
	}

	async saveDmoDetails(shouldSave: boolean): Promise<void> {
		if (this.currentTabIndex === 0) {
			if (shouldSave === false) {
				this.resetDmoDetailsForm();
				this.setDmoDetailsValues();
				return;
			}

			if (!this.dmoDetailsForm.valid) {
				this.dmoDetailsValidations = [];
				if (this.movieTitle.errors != null && this.movieTitle.errors.maxlength) {
					this.dmoDetailsValidations.push(this.maxMovieTitleLengthExceededValidationMessage);
				}

				if (this.movieTitle.errors != null && this.movieTitle.errors.required) {
					this.dmoDetailsValidations.push(this.movieTitleMissingValidationMessage);
				}

				if (this.dmoName.errors != null && this.dmoName.errors.maxlength) {
					this.dmoDetailsValidations.push(this.maxNameLengthExceededValidationMessage);
				}

				if (this.shortComment.errors != null && this.shortComment.errors.maxlength) {
					this.dmoDetailsValidations.push(this.maxShortCommentLengthExceededValidationMessage);
				}

				return;
			}

			const update = {
				movieTitle: this.movieTitle.value,
				name: this.dmoName.value,
				dmoStatusId: this.dmoStatus.value,
				shortComment: this.shortComment.value
			} as UpdateDmoDetailsDto;

			const patch = compare(this.dmoDetails, update);
			await this.editorHub.updateDmoDetails(this.dmoId, patch);

			this.updateDmoDetailsInitialValues();
			this.resetDmoDetailsForm();
			this.setDmoDetailsValues();
		}


	}

	onClose(cancelled: boolean) {
		if (cancelled) {
			this.dialogRef.close({cancelled: true});
			return;
		}

		this.resetDmoDetailsForm();
		this.dialogRef.close({
			cancelled: false 
		});
	}

	swipeTab($event: number): void {
		if (this.currentTabIndex === 0) {
			this.resetDmoDetailsForm();
			this.setDmoDetailsValues();
		}
		this.currentTabIndex = $event;

	} 

	private resetDmoDetailsForm(): void {
		this.dmoDetailsForm.clearValidators();
		this.dmoDetailsForm.reset();
		this.dmoDetailsValidations = [];
	}

	private setDmoDetailsValues() {
		this.dmoName.setValue(this.dmoDetails.name);
		this.movieTitle.setValue(this.dmoDetails.movieTitle);
		this.dmoStatus.setValue(this.dmoDetails.dmoStatusId);
		this.shortComment.setValue(this.dmoDetails.shortComment);
	}

	private updateDmoDetailsInitialValues() {
		this.dmoDetails.name = this.dmoName.value;
		this.dmoDetails.movieTitle = this.movieTitle.value;
		this.dmoDetails.dmoStatusId = this.dmoStatus.value;
		this.dmoDetails.shortComment = this.shortComment.value;
	}

}
