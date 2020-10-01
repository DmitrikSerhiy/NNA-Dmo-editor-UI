import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarManagerService {

  private claseSidebar$: EventEmitter<boolean>;
  private _isOpen: boolean;//BehaviorSubject<boolean>;
  // private _isOpenObeserver: Observable<boolean>

  public get IsOpen(): boolean {
    return this._isOpen; //this._isOpen.value;
  }

  constructor() {
    this.claseSidebar$ = new EventEmitter<boolean>();
    this._isOpen = true;
   }

  subscibe(sidebarEvent: EventEmitter<boolean>) {
    this.claseSidebar$.subscribe(($event) => {
      this._isOpen = $event;
      console.log(`${$event} from subscribe`)
      sidebarEvent.emit($event);
    });
  }

  toggleSidebar($event: boolean, ) {
    console.log(`${$event} from emited`);
    this.claseSidebar$.emit($event)
  }
}
