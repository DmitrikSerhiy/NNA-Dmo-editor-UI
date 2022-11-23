import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DmoDetailsDto } from 'src/app/layout/models';

@Component({
	selector: 'app-dmo-details-popup',
	templateUrl: './dmo-details-popup.component.html',
	styleUrls: ['./dmo-details-popup.component.scss']
})
export class DmoDetailsPopupComponent implements OnInit {

	dmoDetailsForm: FormGroup;

	@HostListener('window:keydown', ['$event'])
	handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			this.onClose(false);
		}
	}

	constructor(
		private dialogRef: MatDialogRef<DmoDetailsPopupComponent>,
		@Inject(MAT_DIALOG_DATA) private data: DmoDetailsDto) {
			console.log(data);
		}

	ngOnInit(): void {
		this.dialogRef.backdropClick().subscribe(() => this.onClose(true));
		this.dmoDetailsForm = new FormGroup({

		});
	}

	onClose(cancelled: boolean) {
		if (cancelled) {
			this.dialogRef.close({cancelled: true});
			return;
		}

		if (!this.dmoDetailsForm.valid) {
			return;
		}

		this.dialogRef.close({
			cancelled: false 
		});
	}

}
