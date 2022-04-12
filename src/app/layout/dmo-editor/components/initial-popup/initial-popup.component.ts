import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, HostListener } from '@angular/core';

@Component({
	selector: 'app-initial-popup',
	templateUrl: './initial-popup.component.html',
	styleUrls: ['./initial-popup.component.scss']
})
export class InitialPopupComponent implements OnInit {

  	maxEntityNameLength = 50;
	maxShortCommentLength = 100;
	shouldShowCustomDmoNameValidation = false;

	private initialData: any;
	allowAutoDmoName: boolean;
	isEdit: boolean;
	dmoForm: FormGroup;
	defaultDmoPlaceholder = 'dmo';
	generatedDmoName: string;

	get dmoNameInput() { return this.dmoForm.get('dmoNameInput'); }
	get movieTitleInput() { return this.dmoForm.get('movieTitleInput'); }
	get shortComment() { return this.dmoForm.get('shortComment'); }
	get dmoStatus() { return this.dmoForm.get('dmoStatus'); }

	@HostListener('window:keydown', ['$event'])
	handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			this.onClose(false);
		}
	}


  	constructor(
    	private dialogRef: MatDialogRef<InitialPopupComponent>,
    	@Inject(MAT_DIALOG_DATA) public data: any) {
			if (data) {
				this.initialData = data;
				this.isEdit = true;
				this.allowAutoDmoName = false;
			} else {
				this.initialData = { cancelled: false };
				this.allowAutoDmoName = true;
			}
    }

	ngOnInit() {
		this.dialogRef.backdropClick().subscribe(() => this.onClose(true));
		this.dmoForm = new FormGroup({
			'dmoNameInput': new FormControl('', [Validators.required, Validators.maxLength(this.maxEntityNameLength)] ),
			'movieTitleInput': new FormControl('', [Validators.required, Validators.maxLength(this.maxEntityNameLength)]),
			'shortComment': new FormControl('',  [Validators.maxLength(this.maxShortCommentLength)] ),
			'dmoStatus': new FormControl('')
		});

		if (this.data) {
			this.dmoNameInput.setValue(this.data.name);
			this.movieTitleInput.setValue(this.data.movieTitle);
			this.shortComment.setValue(this.data.shortComment);
			this.dmoStatus.setValue(this.data.dmoStatus)
		}
	}

	onClose(cancelled: boolean) {
		if (cancelled) {
			this.initialData.cancelled = cancelled;
			this.dialogRef.close(this.initialData);
			return;
		}

		if (!this.dmoForm.valid) {
			return;
		}

		this.dialogRef.close({
			name: this.dmoNameInput.value,
			movieTitle: this.movieTitleInput.value,
			shortComment: this.shortComment.value,
			dmoStatus: this.isEdit ? this.dmoStatus.value : 0,
			cancelled: false 
		});
	}

	dmoNameAutofill(movieInput): void {
		if(!movieInput) {
			this.dmoNameInput.setValue('');
			return;
		}

		this.dmoNameInput.setValue(`${movieInput} ${this.defaultDmoPlaceholder}`);

		if (this.movieTitleInput.value > this.maxEntityNameLength) {
			this.shouldShowCustomDmoNameValidation = false;
			return;
		}

		if (this.dmoNameInput.value.length > this.maxEntityNameLength) {
			this.shouldShowCustomDmoNameValidation = true;
		} else {
			this.shouldShowCustomDmoNameValidation = false;
		}
	}
}
