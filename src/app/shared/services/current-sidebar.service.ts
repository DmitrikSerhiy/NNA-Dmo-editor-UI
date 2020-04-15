import { RightMenues, SidebarTabs } from './../../layout/models';
import { BehaviorSubject } from 'rxjs';
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrentSidebarService {
  private renderer: Renderer2;

  private currentTab: SidebarTabs;
  private previousTab: SidebarTabs;

  private currentMenuSource = new BehaviorSubject('');
  currentMenuSource$ = this.currentMenuSource.asObservable();


  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
   }

  setMenu(tab: SidebarTabs) {
    this.previousTab = this.currentTab ? this.currentTab : SidebarTabs.dashboard;
    this.currentTab = tab;
    this.setSelectedStyle(this.currentTab);
    this.currentMenuSource.next(this.currentTab);
  }

  setPrevious() {
    this.setSelectedStyle(this.previousTab);
    this.currentMenuSource.next(this.previousTab);

    const menu = this.currentTab;
    this.currentTab = this.previousTab;
    this.previousTab = menu;
  }

  private setSelectedStyle(sideBarTab: SidebarTabs) {
    this.clearTabs();
    const selectedTab = this.renderer.selectRootElement(`#${sideBarTab.toString()}-tab`, true);
    this.renderer.addClass(selectedTab, 'router-link-active');
  }

  private clearTabs() {
    Object.keys(SidebarTabs).forEach(sideBarTab => {
      const selectedTab = this.renderer.selectRootElement(`#${sideBarTab.toString()}-tab`, true);
      this.renderer.removeClass(selectedTab, 'router-link-active');
    });
  }

}
