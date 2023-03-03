import { Toastr } from './toastr.service';
import { UserManager } from './user-manager';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { UserRole } from '../models/authDto';

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


@Injectable({
	providedIn: 'root'
  })
export class AuthSuperUserGuard implements CanActivate {

	constructor(private userManager: UserManager,private router: Router) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		if (this.userManager.getHighestUserRole() >= UserRole.SuperUser) {
            return true;
		}

        this.router.navigate(['/access-denied']);
        return false;
	}
}

@Injectable({
	providedIn: 'root'
  })
export class AuthActiveUserGuard implements CanActivate {

	constructor(private userManager: UserManager,private router: Router) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		if (this.userManager.getHighestUserRole() >= UserRole.ActiveUser) {
            return true;
		}

        this.router.navigate(['/access-denied']);
        return false;
	}
}



@Injectable({
	providedIn: 'root'
  })
export class AuthNotActiveUserGuard implements CanActivate {

	constructor(private userManager: UserManager,private router: Router) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		if (this.userManager.getHighestUserRole() >= UserRole.ActiveUser) {
            return true;
		}

        this.router.navigate(['/access-denied']);
        return false;
	}
}
