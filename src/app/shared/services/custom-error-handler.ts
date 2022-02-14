import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

import { Observable, throwError, from } from "rxjs";
import { catchError, concatMap, map, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ToastrErrorMessage, TokenDetails, ValidationResultHandled } from "../models/serverResponse";
import { Toastr } from "./toastr.service";
import { UserManager } from "./user-manager";


@Injectable({
	providedIn: 'root'
})
export class CustomErrorHandler {

	constructor(
		private httpClient: HttpClient,
		private userManager: UserManager,
		private router: Router,
		private toastr: Toastr) {}

	public handle<T>(response: any, originalObs?: Observable<T>) {
		const error = response.error;

		if (error && error.fromExceptionFilter) {
			return throwError({header: `${error.title} ${error.code}`, message: error.message});
		}
		
		

		else if (response.status == 422) {
			return new Observable<any>(sub => {
				this.toastr.validationMessage(error)
				sub.error(new ValidationResultHandled(response.error.title));
				sub.complete();
			});
		}

		else if (response.status == 401) {
			if (response.headers.get('ExpiredToken')) {
				return this.refreshTokens()
					.pipe(
						concatMap((tokenResponse) => {
							if (tokenResponse.accessToken && tokenResponse.refreshToken) {
								this.userManager.updateTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
								return originalObs;
							}
					}));
			} 
		} 
		
		else if (response.status == 400) {
			if (error.hasMassageInUI) {
				return new Observable<any>(sub => {
					sub.error(error.errorMessage);
					sub.complete();
				});
			}
			this.toastr.error(new ToastrErrorMessage(error.errorMessage, 'Bad request'));
			return throwError({header: 'Bad request', serverResponse: response } );
		}

		// else if (response.status == 404) {
		// 	this.toastr.error(new ToastrErrorMessage(response.error, 'Entity is not Found: 404'));
		// 	return throwError({header: 'Entity is not Found', status: 404 } );
		// }

		this.toastr.error(new ToastrErrorMessage('Administrator has been notified', 'Unverified error'));
		return throwError({message: 'Unverified error', serverResponse: response});
	}




	private clearLocalStorageAndRedirectToLogin(): Observable<any> {
		this.userManager.clearUserData();
		return from(this.router.navigate(['/login']))
	}

	private refreshTokens(): Observable<TokenDetails> {
		return this.httpClient
			.post<TokenDetails>(environment.server_user + 'account/refresh', {accessToken: this.userManager.getAccessToken(), refreshToken: this.userManager.getRefreshToken()} )
			.pipe( 
				catchError(response => {    
					if (response.status == 401 && response.headers.get('RedirectToLogin')) {
						return this.clearLocalStorageAndRedirectToLogin();
					} 
					
					console.log(response);
					return this.clearLocalStorageAndRedirectToLogin();
				})
			); 
	}
} 