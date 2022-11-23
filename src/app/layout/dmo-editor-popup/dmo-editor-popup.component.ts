import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, HostListener } from '@angular/core';

@Component({
	selector: 'dmo-editor-popup',
	templateUrl: './dmo-editor-popup.component.html',
	styleUrls: ['./dmo-editor-popup.component.scss']
})
export class DmoEditorPopupComponent implements OnInit {

  	maxEntityNameLength = 100;
	maxShortCommentLength = 500;
	shouldShowCustomDmoNameValidation = false;

	dmoForm: FormGroup;
	defaultDmoPlaceholder = 'dmo';
	generatedDmoName: string;

	get dmoNameInput() { return this.dmoForm.get('dmoNameInput'); }
	get movieTitleInput() { return this.dmoForm.get('movieTitleInput'); }
	get shortComment() { return this.dmoForm.get('shortComment'); }

	@HostListener('window:keydown', ['$event'])
	handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			this.onClose(false);
		}
	}

  	constructor(private dialogRef: MatDialogRef<DmoEditorPopupComponent>) { }

	ngOnInit() {
		this.dialogRef.backdropClick().subscribe(() => this.onClose(true));
		this.dmoForm = new FormGroup({
			'dmoNameInput': new FormControl('', [Validators.maxLength(this.maxEntityNameLength)] ),
			'movieTitleInput': new FormControl('', [Validators.required, Validators.maxLength(this.maxEntityNameLength)]),
			'shortComment': new FormControl('',  [Validators.maxLength(this.maxShortCommentLength)] )
		});
	}

	onClose(cancelled: boolean) {
		if (cancelled) {
			this.dialogRef.close({cancelled: true});
			return;
		}

		if (!this.dmoForm.valid) {
			return;
		}

		this.dialogRef.close({
			name: this.dmoNameInput.value,
			movieTitle: this.movieTitleInput.value,
			shortComment: this.shortComment.value,
			cancelled: false 
		});
	}

	// dmoNameAutofill(movieInput): void {
	// 	if(!movieInput) {
	// 		this.dmoNameInput.setValue('');
	// 		return;
	// 	}

	// 	this.dmoNameInput.setValue(`${movieInput} ${this.defaultDmoPlaceholder}`);

	// 	if (this.movieTitleInput.value > this.maxEntityNameLength) {
	// 		this.shouldShowCustomDmoNameValidation = false;
	// 		return;
	// 	}

	// 	if (this.dmoNameInput.value.length > this.maxEntityNameLength) {
	// 		this.shouldShowCustomDmoNameValidation = true;
	// 	} else {
	// 		this.shouldShowCustomDmoNameValidation = false;
	// 	}
	// }
}
