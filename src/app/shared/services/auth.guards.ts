import { Toastr } from './toastr.service';
import { UserManager } from './user-manager';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

// for individual component protection
@Injectable({
	providedIn: 'root'
  })
export class AuthGuard implements CanActivate {

	constructor(
			private userManager: UserManager,
			private toastr: Toastr,
			private router: Router
		) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		if (!this.userManager.isAuthorized()) {
			this.router.navigate(['/access-denied']);
			return false;
		}
		return true;
	}
}
