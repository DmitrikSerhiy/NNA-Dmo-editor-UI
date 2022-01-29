import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { NnaHelpersService } from './nna-helpers.service';

@Injectable({
  	providedIn: 'root'
})
export class RightMenuGrabberService {

	private shouldShowGrabber = false;
	private shouldShowGrabberSource = new BehaviorSubject(false);
	shouldShowGrabber$ = this.shouldShowGrabberSource.asObservable();

  	constructor(private nnaHelpersService: NnaHelpersService) { }

	showGrabber() {
		this.shouldShowGrabber = true;
		this.shouldShowGrabberSource.next(true);
	}

	hideGrabber() {
		this.shouldShowGrabber = false;
		this.shouldShowGrabberSource.next(false);
	}

	async isGrabberShouldBeShown(delay: boolean = true) {
		if (delay) {
			await this.nnaHelpersService.sleep(1000);
		}

		return this.shouldShowGrabber;
	}
}
