import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
	selector: 'app-google-button',
	templateUrl: './google-button.component.html',
	styleUrls: ['./google-button.component.scss']
})
export class GoogleButtonComponent {

	@Input() disabled: boolean;
  	@Output() googleButtonClicked: EventEmitter<void>;

	constructor() {
		this.googleButtonClicked = new EventEmitter<void>();
	}

	onGoogleClicked(): void {
		if (this.disabled) {
			return;
		}

		this.googleButtonClicked.emit();
	}
}
