
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { UserDetails } from '../models/serverResponse';

import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';

@Injectable()
export class AuthService {
    serverUrl = environment.server_user + 'account';
    constructor(private http: HttpClient, 
        private errorHandler: CustomErrorHandler) { }

    checkUserEmail(email: string): Promise<boolean> {
        return this.http
            .post(this.serverUrl + '/email', { 'email': email } )
            .pipe(
                map((response: boolean) => response),
                catchError(this.errorHandler.handle)).toPromise();
    }

    checkName(name: string): Promise<boolean> {
        return this.http
            .post(this.serverUrl + '/name', { 'name': name } )
            .pipe(
                map((response: boolean) => response),
                catchError(this.errorHandler.handle)).toPromise();;
    }

    authenticate(email: string, password: string): Observable<UserDetails> {
        return this.http
            .post(this.serverUrl + '/token', { 'email': email, 'password': password } )
            .pipe(
                map((response: UserDetails) => response),
                catchError(this.errorHandler.handle));
    }

    register(userName: string, email: string, password: string): Observable<UserDetails> {
        return this.http
            .post(this.serverUrl + '/register', {'userName': userName, 'email': email, 'password': password})
            .pipe(
                map((response: UserDetails) => response),
                catchError(this.errorHandler.handle));
    }
}
