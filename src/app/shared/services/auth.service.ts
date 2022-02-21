
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SendMailReason, UserDetails } from '../models/serverResponse';

import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';
import { AuthGoogleDto, PersonalInfoDto } from '../models/authDto';

@Injectable()
export class AuthService {
    private serverUrl: string = environment.server_user + 'account';

    constructor(
            private http: HttpClient, 
            private errorHandler: CustomErrorHandler) {
    }

    getPersonalInfo(): Observable<PersonalInfoDto> {
		return this.http
            .get<PersonalInfoDto>(this.serverUrl + '/personalInfo')
            .pipe(catchError((response, obs) => this.errorHandler.handle<PersonalInfoDto>(response, obs)));
	}

    updateUserName(newUserName: string): Observable<boolean> {
		return this.http
            .put<boolean>(this.serverUrl + '/name', {userName: newUserName})
            .pipe(catchError((response, obs) => this.errorHandler.handle<boolean>(response, obs)));
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

    logout(): Observable<any> {
        return this.http
            .delete<any>(this.serverUrl + '/logout' )
            .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)) );
    }

    ping(): Observable<any> {
        return this.http.get<any>(this.serverUrl + '/ping');
    }  

    googleAuth(authGoogleDto: AuthGoogleDto): Promise<UserDetails> {
        return this.http
            .post<UserDetails>(this.serverUrl + '/google', {'email': authGoogleDto.email, 'name': authGoogleDto.name, 'googleToken': authGoogleDto.googleToken })
            .pipe(catchError((response, obs) => this.errorHandler.handle<UserDetails>(response, obs)))
            .toPromise();
    }

    sendMail(target: string, reason: SendMailReason): Observable<any> {
        return this.http
            .post<any>(this.serverUrl + '/mail', {'email': target, 'reason': reason as number })
            .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)) );
    }    
    
    validateMailAndToken(email: string, token: string, reason: SendMailReason): Observable<boolean> {
        return this.http
            .post<boolean>(this.serverUrl + '/validate/tokenFromMail', { 'email': email, 'token': token, 'reason': reason as number })
            .pipe(catchError((response, obs) => this.errorHandler.handle<boolean>(response, obs)) );
    }

	setOrResetPassword(email: string, token: string, reason: SendMailReason, password: string): Observable<any> {
        return this.http
            .put<any>(this.serverUrl + '/password', { 'email': email, 'token': token, 'reason': reason as number, 'newPassword': password})
            .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)) );
    }

    test(): Observable<any> {
        return this.http
            .get<any>(environment.server_user + 'health/security')
            .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)) );
    }
}
