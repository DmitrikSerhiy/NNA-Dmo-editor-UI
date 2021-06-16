import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { UserManager } from "./user-manager";

// for routing protection
@Injectable({
	providedIn: 'root'
  })
export class AuthGuardForChild implements CanActivateChild {

	constructor(
			private userManager: UserManager,
			private router: Router
		) { }

	canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		if (!this.userManager.isAuthorized()) {
			this.router.navigate(['/access-denied']);
			return false;
		}
		return true;
	}
}