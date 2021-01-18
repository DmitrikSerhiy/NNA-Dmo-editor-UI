import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextDetectorService {

  private state: number;
  private delayCount: number;
  private changes: any[];
  public textDetector: EventEmitter<any>;

  private triggerDelay = function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  constructor() { 
    this.delayCount = 1500;
    this.state = 0;
    this.changes = [];
    this.textDetector = new EventEmitter();
  }

  public detect(beatId: string, newText: string): void {
    this.state = this.state + 1; 
    if (this.changes.some(change => change.beatId == beatId)) {
      this.changes = this.changes.map(change => {
        if (change.beatId == beatId) {
          change.data = newText;
          return change;
        }
        return change;
      });
    } else {
      this.changes.push({beatId, data: newText});
    }

    this.pauseAndEmitChanges(this.state);
  }

  private pauseAndEmitChanges(state: number) {
    this.triggerDelay(this.delayCount).then(() => {
      if (this.state == state) {
        this.textDetector.emit(this.changes);
        this.state = 0;
        this.changes = [];
      }
    })
  }
}
