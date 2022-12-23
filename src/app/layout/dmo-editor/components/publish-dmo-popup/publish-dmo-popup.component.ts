import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
	selector: 'app-publish-dmo-popup',
	templateUrl: './publish-dmo-popup.component.html',
	styleUrls: ['./publish-dmo-popup.component.scss']
})
export class PublishDmoPopupComponent implements OnInit {

	shouldPublish: boolean;

	constructor(
		public dialogRef: MatDialogRef<PublishDmoPopupComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any) {
			this.shouldPublish = data.shouldPublish;
		}

	ngOnInit(): void {
		this.dialogRef.backdropClick().subscribe(() => this.onClose(false));
		this.dialogRef.disableClose = true;
		this.dialogRef.keydownEvents().subscribe($event => {
			const key = $event.which || $event.keyCode || $event.charCode;
			if (key == 27) { // esc
				this.onClose(false);
			}
		});

		document.addEventListener('keydown', this.keydownHandlerWrapper);
	}

	onClose(apply: boolean) {
		if (!apply) {
			this.dialogRef.close(false);
			return;
		}
		this.dialogRef.close(true);
	}


	private keydownHandlerWrapper = function($event) {
		const key = $event.which || $event.keyCode || $event.charCode;

		if (key === 13) {
			$event.preventDefault();
			this.onClose(true);
		}
	}.bind(this);
}