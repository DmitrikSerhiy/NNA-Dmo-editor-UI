import { EventEmitter, Injectable } from '@angular/core';
import { from  } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TextDetectorService {

  private hasChanges: boolean;
  private checkInterval: number;
  private changes: any[];
  public textDetector: EventEmitter<any>;
  

  constructor() { 
    this.checkInterval = 1500;
    this.hasChanges = false;
    this.changes = [];
    this.textDetector = new EventEmitter();
    from(this.checkChanges()).subscribe();
  }

  public detect(beatId: string, newText: string): void {
    this.hasChanges = true; 
    this.changes.push({beatId, newText});
  }


  private async checkChanges() {
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
        console.log('text did not changed');
        continue;
      }  
      
      this.textDetector.emit(this.changes);
      this.hasChanges = false;
      this.changes = [];

    } while (!initial);
  }
}
