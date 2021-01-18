import { EventEmitter, Injectable } from '@angular/core';
import { ChangeType } from './../models/changeTypes';
import { from  } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorChangeDetectorService {

  private hasChanges: boolean;
  private checkInterval: number;

  private cnanges: Array<string>;
  public detector: EventEmitter<any>;

  constructor() {
    this.hasChanges = false;
    this.checkInterval = 3000;
    this.detector = new EventEmitter();
    this.cnanges = [];
    from(this.startDetectionAsync()).subscribe();
  }


  detect(changeType: ChangeType): void {
    this.cnanges.push(changeType.toString());
    this.hasChanges = true;
  }

  private async startDetectionAsync() {

    let initial = true;
    function delay(ms: number) {
      return new Promise( resolve => setTimeout(resolve, ms) );
    }

    do {
      if (!initial) {
        await delay(this.checkInterval);
      } else {
        initial = false;
      }
      
      if (this.hasChanges === false) {
        // console.log('nothing');
        continue;
      }  
      
      this.detector.emit(this.cnanges);

      this.cnanges = [];
      this.hasChanges = false;

    } while (!initial);
  }
}
