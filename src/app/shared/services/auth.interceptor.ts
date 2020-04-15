import { UserManager } from 'src/app/shared/services/user-manager';

import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private userManager: UserManager) { }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler): Observable<HttpEvent<any>> {

        const jwt = this.userManager.getJWT();

        if (jwt) {
            const cloned = req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + jwt)
            });

            return next.handle(cloned);
        }
        return next.handle(req);
    }
}

