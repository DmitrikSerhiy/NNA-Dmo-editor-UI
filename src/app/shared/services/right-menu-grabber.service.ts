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

  async isGrabbershouldBeShown(delay: boolean = true) {
    if (delay) {
      await this.sleep(1000);
    }

    return this.shouldShowGrabber;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  constructor() { }
}
