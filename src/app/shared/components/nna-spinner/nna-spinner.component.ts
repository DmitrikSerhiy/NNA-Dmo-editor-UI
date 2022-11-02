import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

@Component({
	selector: 'app-nna-spinner',
	templateUrl: './nna-spinner.component.html',
	styleUrls: ['./nna-spinner.component.scss']
})
export class NnaSpinnerComponent implements OnInit, OnDestroy {
	visible: boolean = true;
	isInitial: boolean = true;
	intervalId: any;

 	constructor(private cdRef: ChangeDetectorRef) { }

	ngOnInit() {
		this.intervalId = setInterval( () => {
			this.toggle();
		}, 800)
	}

	ngOnDestroy(): void {
		clearInterval(this.intervalId);
	}

	private toggle(): void {
		this.visible = !this.visible;
		this.cdRef.detectChanges();
	}
}
