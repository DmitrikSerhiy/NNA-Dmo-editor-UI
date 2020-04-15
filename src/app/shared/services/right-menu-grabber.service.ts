import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RightMenuGrabberService {

  private shouldShowGrabber = false;
  private shouldShowGrabberSource = new BehaviorSubject(false);
  shouldShowGrabber$ = this.shouldShowGrabberSource.asObservable();

  showGrabber() {
    this.shouldShowGrabber = true;
    this.shouldShowGrabberSource.next(true);
  }

  hideGrabber() {
    this.shouldShowGrabber = false;
    this.shouldShowGrabberSource.next(false);
  }

  isGrabbershouldBeShown() {
    return this.shouldShowGrabber;
  }

  constructor() { }
}
