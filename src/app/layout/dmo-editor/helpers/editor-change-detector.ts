import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EditorChangeDetectorService {

  private checkInterval: number;
  private changes: Array<string>;
  private state: number;

  public detector: EventEmitter<any>;

  private triggerDelay = function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  constructor() {
    this.checkInterval = 10000;
    this.detector = new EventEmitter();
    this.state = 0;
    this.changes = [];
  }


  detect(changeType: any): void {
    this.state = this.state + 1; 
    this.changes.push(changeType.toString());
    this.pauseAndEmitChanges(this.state)
  }


  private pauseAndEmitChanges(state: number) {
    this.triggerDelay(this.checkInterval).then(() => {
      if (this.state == state) {
        this.detector.emit(this.changes);
        this.state = 0;
        this.changes = [];
      }
    })
  }
}
