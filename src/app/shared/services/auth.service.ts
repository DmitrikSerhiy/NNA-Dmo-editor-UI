
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { UserDetails } from '../models/serverResponse';

@Injectable()
export class AuthService {

    //todo: relocate it to environment file
    serverUrl = 'https://localhost:44305/api/account/';
    constructor(private http: HttpClient) { }

    authorize(email: string, password: string): Observable<UserDetails> {
        return this.http
            .post(this.serverUrl + 'token', { 'email': email, 'password': password } )
            .pipe(
                map((response: UserDetails) => response),
                catchError(this.handleError));
    }

    register(userName: string, email: string, password: string): Observable<UserDetails> {
        return this.http
            .post(this.serverUrl + 'register', {'userName': userName, 'email': email, 'password': password})
            .pipe(
                map((response: UserDetails) => response),
                catchError(this.handleError));
    }

    private handleError(err: HttpErrorResponse) {
        const errorMessage = err.error.errorMessage;
        if (!errorMessage) {
            return throwError('Server error. Try later.');
        }

        return throwError(errorMessage);
    }
}
