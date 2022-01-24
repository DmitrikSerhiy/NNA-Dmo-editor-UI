
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserDetails } from '../models/serverResponse';

import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';
import { AuthGoogleDto } from '../models/authDto';

@Injectable()
export class AuthService {
    private serverUrl: string = environment.server_user + 'account';

    constructor(
            private http: HttpClient, 
            private errorHandler: CustomErrorHandler) {
    }

    checkUserEmail(email: string): Promise<boolean> {
        return this.http
            .post<boolean>(this.serverUrl + '/email', { 'email': email } )
            .pipe(catchError((response, obs) => this.errorHandler.handle<boolean>(response, obs)))
            .toPromise();
    }

    checkSsoAndPassword(email: string): Promise<string> {
        return this.http
            .post<string>(this.serverUrl + '/authprovider', { 'email': email } )
            .pipe(catchError((response, obs) => this.errorHandler.handle<string>(response, obs)))
            .toPromise();
    }

    checkName(name: string): Promise<boolean> {
        return this.http
            .post<boolean>(this.serverUrl + '/name', { 'name': name } )
            .pipe(catchError((response, obs) => this.errorHandler.handle<boolean>(response, obs) ))
            .toPromise();;
    }

    authenticate(email: string, password: string): Observable<UserDetails> {
        return this.http
            .post<UserDetails>(this.serverUrl + '/token', { 'email': email, 'password': password } )
            .pipe(catchError((response, obs)=> this.errorHandler.handle<UserDetails>(response, obs)));
    }

    register(userName: string, email: string, password: string): Observable<UserDetails> {
        return this.http
            .post<UserDetails>(this.serverUrl + '/register', {'userName': userName, 'email': email, 'password': password})
            .pipe(catchError((response, obs) => this.errorHandler.handle<UserDetails>(response, obs) ));
    }

    logout(email: string): Observable<any> {
        return this.http
            .delete<any>(this.serverUrl + '/logout', {body: {email: email} } )
            .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)) );
    }

    verify(): Observable<any> {
        return this.http
            .get<any>(this.serverUrl + '/verify')
            .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)) );
    }  

    googleAuth(authGoogleDto: AuthGoogleDto): Promise<UserDetails> {
        return this.http
            .post<UserDetails>(this.serverUrl + '/google', {'email': authGoogleDto.email, 'name': authGoogleDto.name, 'googleToken': authGoogleDto.googleToken })
            .pipe(catchError((response, obs) => this.errorHandler.handle<UserDetails>(response, obs)))
            .toPromise();
    }

    test(): Observable<any> {
        return this.http
            .get<any>(environment.server_user + 'health/security')
            .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)) );
    }
}
