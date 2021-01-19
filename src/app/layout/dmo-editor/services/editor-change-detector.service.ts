import { EventEmitter, Injectable } from '@angular/core';
import { ChangeType } from './../models/changeTypes';
import { from  } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorChangeDetectorService {

  // private hasChanges: boolean;
  private checkInterval: number;

  private changes: Array<string>;
  private state: number;
  public detector: EventEmitter<any>;

  private triggerDelay = function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  constructor() {
    // this.hasChanges = false;
    this.checkInterval = 3000;
    this.detector = new EventEmitter();
    this.state = 0;
    this.changes = [];
    // from(this.startDetectionAsync()).subscribe();
  }


  detect(changeType: ChangeType): void {
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
  // private async startDetectionAsync() {

  //   let initial = true;
  //   function delay(ms: number) {
  //     return new Promise( resolve => setTimeout(resolve, ms) );
  //   }

  //   do {
  //     if (!initial) {
  //       await delay(this.checkInterval);
  //     } else {
  //       initial = false;
  //     }
      
  //     if (this.hasChanges === false) {
  //       // console.log('nothing');
  //       continue;
  //     }  
      
  //     this.detector.emit(this.cnanges);

  //     this.cnanges = [];
  //     this.hasChanges = false;

  //   } while (!initial);
  //}
}
