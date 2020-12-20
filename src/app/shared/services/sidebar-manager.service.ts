import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarManagerService {
  private sidebar : BehaviorSubject<boolean>;
  sidebarObserver$: Observable<boolean>; 

  private _isOpen: boolean;

  public get IsOpen(): boolean {
    return this._isOpen;
  }

  constructor() {
    this._isOpen = false;
    // this._isOpen = true;
    this.sidebar = new BehaviorSubject<boolean>(true);
    this.sidebarObserver$ = this.sidebar.asObservable();
   }

  toggleSidebar() { 
    this._isOpen = !this._isOpen;
    this.sidebar.next(this._isOpen)
  }

  collapseSidebar() {
    this._isOpen = false;
    this.sidebar.next(false);
  }
}
