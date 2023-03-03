import { SidebarTabs } from './../../layout/models';
import { BehaviorSubject } from 'rxjs';
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  	providedIn: 'root'
})
export class CurrentSidebarService {
	private renderer: Renderer2;

	private currentTab: SidebarTabs;
	private previousTab: SidebarTabs;

	private currentMenuSource = new BehaviorSubject('');
	currentMenuSource$ = this.currentMenuSource.asObservable();


	constructor(rendererFactory: RendererFactory2) {
		this.renderer = rendererFactory.createRenderer(null, null);
	}

	setMenu(tab: SidebarTabs) {
		this.previousTab = this.currentTab;

		if (!tab) {
			tab = SidebarTabs.none
		}

		this.currentTab = tab;
		this.setSelectedStyle(this.currentTab);
		this.currentMenuSource.next(this.currentTab);
	}

	setPrevious() {
		if (!this.previousTab) {
			let currntPosition = location.pathname.split('/').pop();
			if (currntPosition == 'dmoCollection') {
				currntPosition = 'dmoCollections';
			}
			this.previousTab = currntPosition as SidebarTabs; // stupid bugfix because of stupid service realization
		}
		this.setSelectedStyle(this.previousTab);
		this.currentMenuSource.next(this.previousTab);

		const menu = this.currentTab;
		this.currentTab = this.previousTab;
		this.previousTab = menu;
	}

	resetTabs() {
		Object.keys(SidebarTabs)
			.filter(t => t!=  SidebarTabs.none)
			.forEach(sideBarTab => {
				try {
					const selectedTab = this.renderer.selectRootElement(`#${sideBarTab.toString()}-tab`, true);
					this.renderer.removeClass(selectedTab, 'router-link-active');
				} catch { } // boolshit

		});
	}

	private setSelectedStyle(sideBarTab: SidebarTabs) {
		this.resetTabs();
		if (!sideBarTab || sideBarTab == SidebarTabs.none) {
			return;
		}
		
		if(sideBarTab.toString() == 'app') {
			return;
		}
		const selectedTab = this.renderer.selectRootElement(`#${sideBarTab.toString()}-tab`, true);
		this.renderer.addClass(selectedTab, 'router-link-active');
	}
}
