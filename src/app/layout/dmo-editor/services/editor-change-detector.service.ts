import { EventEmitter, Injectable } from '@angular/core';
import { ChangeType } from './../models/changeTypes';

@Injectable({
  providedIn: 'root'
})
export class EditorChangeDetectorService {

  private hasChanges: boolean;
  private checkInterval: number;

  private cnanges: Array<any>;
  public detector: EventEmitter<any>;

  constructor() {
    this.hasChanges = false;
    this.checkInterval = 2000;
    this.detector = new EventEmitter();
    this.cnanges = [];
    this.startDetection();
  }


  detect(data: any, changeType: ChangeType): void {
    this.cnanges.push({data, changeType});
    this.hasChanges = true;
    console.log(this.hasChanges);
    console.log(this.cnanges);
  }

//fix here scope is not accessible
  private startDetection() {
    setInterval(function() { 

      if (!this.hasChanges) {
        console.log('nothing');
        return;
      }  

      this.sender.emit(this.cnanges);

      this.cnanges = [];
      this.hasChanges = false;

      console.log('change detected');
    }, this.checkInterval);
  }
}
