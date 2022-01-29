import { Component, OnInit } from '@angular/core';
import { NnaHelpersService } from '../../services/nna-helpers.service';

@Component({
	selector: 'app-nna-spinner',
	templateUrl: './nna-spinner.component.html',
	styleUrls: ['./nna-spinner.component.scss']
})
export class NnaSpinnerComponent implements OnInit {
	visible: boolean = true;
	isInitial: boolean = true;

 	constructor(private nnaHelpersService: NnaHelpersService) { }

	async ngOnInit() {
		do {
			await this.nnaHelpersService.sleep(800);
			this.toggle();
		} while(true)
	}

	private toggle(): void {
		this.visible = !this.visible;
	}
}
