import { Toastr } from './toastr.service';
import { UserManager } from './user-manager';
import { Observable } from 'rxjs';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild, Router, } from '@angular/router';

// for routing protection
export class AuthGuardForChild implements CanActivateChild {

    constructor(
        private userManager: UserManager,
        private router: Router) { }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (!this.userManager.isAuthorized()) {
            this.router.navigate(['/access-denied']);
            return false;
        }
        return true;
    }
}

// for individual component protection
export class AuthGuard implements CanActivate {

    constructor(
        private userManager: UserManager,
        private toastr: Toastr) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (!this.userManager.isAuthorized()) {
            this.toastr.info('You have to log in.');
            console.log(state);
            return false;
        }
        return true;
    }
}
