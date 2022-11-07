import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  	providedIn: 'root'
})
export class SidebarManagerService {
	private storageSidebarKey: string = 'sidebar state';
	private sidebar : BehaviorSubject<boolean>;
	sidebarObserver$: Observable<boolean>; 

	public get IsOpen(): boolean {
		return localStorage.getItem(this.storageSidebarKey) == "true";
	}
	private set IsOpen(value: boolean) {
		this.setSidebarState(value);
	}

	constructor() {}

	init() {
		const savedState = localStorage.getItem(this.storageSidebarKey);
		if (savedState === null) {
			this.setSidebarState(true);
		}

		this.sidebar = new BehaviorSubject<boolean>(this.IsOpen);
		this.sidebarObserver$ = this.sidebar.asObservable();
	}

	toggleSidebar() { 
		this.IsOpen = !this.IsOpen;
		this.sidebar.next(this.IsOpen)
	}

	collapseSidebar() {
		this.IsOpen = false;
		this.sidebar.next(false);
	}

	clearSidebarState() {
		localStorage.removeItem(this.storageSidebarKey);
	}

	private setSidebarState(value: boolean) {
		localStorage.setItem(this.storageSidebarKey, `${value}`)
	}
}
