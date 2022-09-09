import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  	providedIn: 'root'
})
export class RightMenuGrabberService {

	private shouldShowGrabber = false;
	private shouldShowGrabberSource = new BehaviorSubject(false);
	shouldShowGrabber$ = this.shouldShowGrabberSource.asObservable();

  	constructor() { }

	showGrabber() {
		this.shouldShowGrabber = true;
		this.shouldShowGrabberSource.next(true);
	}

	hideGrabber() {
		this.shouldShowGrabber = false;
		this.shouldShowGrabberSource.next(false);
	}

	isGrabberShouldBeShown() {
		return this.shouldShowGrabber;
	}
}
