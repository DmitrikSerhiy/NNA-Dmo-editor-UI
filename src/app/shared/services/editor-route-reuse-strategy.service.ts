import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
import { SidebarManagerService } from './sidebar-manager.service';

@Injectable({
	providedIn: 'root'
})
export class EditorRouteReuseStrategyService extends BaseRouteReuseStrategy {

	handlers: { [key: string]: DetachedRouteHandle } = {};

	constructor(private sidebarManagerService: SidebarManagerService ) {
		super();
	}

	shouldDetach(route: ActivatedRouteSnapshot): boolean {
		return false;
	}

	store(route: ActivatedRouteSnapshot, handle: {}): void { }

	shouldAttach(route: ActivatedRouteSnapshot): boolean {
		return false;
	}

	retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle|null {
		return null;
	}

	shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
		const isSameRoute = future.routeConfig === curr.routeConfig

		if (curr.routeConfig !== null && future.routeConfig !== null) {
			this.handleSidebarForEditorPage(future, curr);
		}

		if (future.data.shouldReuse === false) {
			return false;
		}

		return isSameRoute;
	}

	private handleSidebarForEditorPage(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot) {
		if ((!curr.routeConfig.path.includes('editor')) && future.routeConfig.path.includes('editor')) {
			if (this.sidebarManagerService.IsOpen === true) {
				this.sidebarManagerService.collapseSidebar();
			}
		} else if (curr.routeConfig.path.includes('editor') && (!future.routeConfig.path.includes('editor'))) {
			if (this.sidebarManagerService.IsOpen === false) {
				this.sidebarManagerService.toggleSidebar();
			}
		}
	}
}
