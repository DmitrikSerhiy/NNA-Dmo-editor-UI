import { Injectable } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { concatMap } from "rxjs/operators";
import { ToastrErrorMessage, ValidationResultHandled } from "../models/serverResponse";
import { RefreshHelperService } from "./refresh-helper.service";
import { Toastr } from "./toastr.service";
import { UserManager } from "./user-manager";

@Injectable({
	providedIn: 'root'
})
export class CustomErrorHandler {

	constructor(
		private userManager: UserManager,
		private toastr: Toastr,
		private refreshHelperService: RefreshHelperService) {}

	public handle<T>(response: any, originalObs?: Observable<T>) {
		const error = response.error;

		if (response.status == 422) {
			return new Observable<any>(sub => {
				this.toastr.showValidationMessage(error)
				sub.error(new ValidationResultHandled(error.title));
				sub.complete();
			});
		}

		
		else if (response.status == 401) {
			if (response.headers.get('ExpiredToken')) {
				return this.refreshHelperService.tryRefreshTokens()
					.pipe(
						concatMap((tokenResponse) => {
							if (tokenResponse.accessToken && tokenResponse.refreshToken) {
								this.userManager.updateTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
								return originalObs;
							}
					}));
			} else if (error.fromExceptionMiddleware) {
				if (response.headers.get('RedirectToLogin')) {
					return this.refreshHelperService.clearLocalStorageAndRedirectToLogin();
				}
			}
		} 
		
		else if (response.status == 400) {
			if (error.hasMassageInUI) {
				return new Observable<any>(sub => {
					sub.error(error.errorMessage);
					sub.complete();
				});
			}
			this.toastr.showError(new ToastrErrorMessage(error.errorMessage, 'Bad request'));
			return throwError({message: 'Bad request', serverResponse: response } );
		}

		else if (response.headers.get('RedirectToLogin') || response.status == 403) {
			return this.refreshHelperService.clearLocalStorageAndRedirectToLogin();
		}

		else if (response.status == 429) {
			this.toastr.showError(new ToastrErrorMessage('Try again later', 'Too many requests'));
			return new Observable<any>(sub => {
				sub.error('Too many requests');
				sub.complete();
			});
		}

		// else if (response.status == 404) {
		// 	this.toastr.error(new ToastrErrorMessage(response.error, 'Entity is not Found: 404'));
		// 	return throwError({message: 'Entity is not Found', status: 404 } );
		// }

		else if (error.fromExceptionFilter) {
			this.toastr.showError(new ToastrErrorMessage(error.message, `${error.title} ${error.code}`));
			return throwError({message: error.title, serverResponse: response});
		} 
		
		else {
			this.toastr.showError(new ToastrErrorMessage('Administrator has been notified', 'Unverified error'));
			return throwError({message: 'Unverified error', serverResponse: response, unhandledError: true});
		}
	}
} 