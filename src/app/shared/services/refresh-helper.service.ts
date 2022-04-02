import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ToastrErrorMessage, TokenDetails } from '../models/serverResponse';
import { Toastr } from './toastr.service';
import { UserManager } from './user-manager';

@Injectable({
  	providedIn: 'root'
})
export class RefreshHelperService {

  	constructor(		
		private httpClient: HttpClient,
		private userManager: UserManager,
		private router: Router,
		private toastr: Toastr) { }

	
	public clearLocalStorageAndRedirectToLogin(withRedirect: boolean = true): Observable<any> {
		this.userManager.clearUserData();
		if (withRedirect) {
			return from(this.router.navigate(['/login']))
		}
		return of<any>();
	}

	public tryRefreshTokens(withRedirect: boolean = true): Observable<TokenDetails> {
		return this.httpClient
			.post<TokenDetails>(environment.server_user + 'account/refresh', {accessToken: this.userManager.getAccessToken(), refreshToken: this.userManager.getRefreshToken()} )
			.pipe( 
				catchError(response => {    
					if (response.status == 401 && response.headers.get('RedirectToLogin')) {
						return this.clearLocalStorageAndRedirectToLogin(withRedirect);
					} 
					
					this.toastr.error(new ToastrErrorMessage('Unverified error', 'Failed to refresh tokens'));
					return this.clearLocalStorageAndRedirectToLogin(withRedirect);
				})
			); 
	}  
}
