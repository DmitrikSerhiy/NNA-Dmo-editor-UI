import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

import { Observable, throwError, from } from "rxjs";
import { catchError, concatMap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { TokenDetails, UserDetails } from "../models/serverResponse";
import { Toastr } from "./toastr.service";
import { UserManager } from "./user-manager";


@Injectable({
  providedIn: 'root'
})
export class CustomErrorHandler {
  private serverUrl: string = environment.server_user + 'account';

  constructor(
    private httpClient: HttpClient,
    private userManager: UserManager,
    private router: Router,
    private toastr: Toastr) {}

  public handle<T>(response: any, originalObs?: Observable<T>) {
    const error = response.error;
    console.log(error);

    if (error && error.fromExceptionFilter) {
      return throwError({header: `${error.title} ${error.code}`, message: error.message});
    }
    
    else if (response.status == 422) {
      return new Observable<any>(sub => {
        let failedResult = new UserDetails();
        failedResult.errorMessage = '422';
        sub.next(failedResult);
        sub.complete();
      });
    }

    else if (response.status == 401) {
      if (response.headers.get('RedirectToLogin')) {
        return this.clearLocalStorageAndRedirectToLogin();
      }

      if (response.headers.get('ExpiredToken')) {
        console.log('request refresh');

        return this.requestRefreshTokens()
          .pipe(
            concatMap( (response) => {
              if (response == null) {
                return this.clearLocalStorageAndRedirectToLogin(); 
              }
              console.log('UPDATE TOKENS in local storage');
              this.userManager.updateTokens(response.accessToken, response.refreshToken);
              return originalObs;
            }
          )
        )
      } 
    } 
    
    else if (response.status == 400) {
      this.toastr.error({'header': 'Bad request', 'message': 'Administrator has been notified.'})
    }

    else if (response.status == 404) {
      return throwError({header: 'Entity is not Found', status: 404 } );
    }

    return throwError({header: 'Unverified error', message: 'Administrator has been notified.'});
  }




  private clearLocalStorageAndRedirectToLogin(): Observable<any> {
    this.userManager.clearUserData();
    return from(this.router.navigate(['/login']))
  }
  
  private requestRefreshTokens(): Observable<TokenDetails> {
    return this.httpClient
      .post<TokenDetails>(this.serverUrl + '/refresh', {accessToken: this.userManager.getAccessToken(), refreshToken: this.userManager.getRefreshToken()} )
      .pipe(
        catchError(response => {    
          if (response.headers.get('RedirectToLogin')) {
            // refresh endpoint throws an error because of invalid tokens
            return new Observable<any>(sub => {
              sub.next(null);
              sub.complete();
            });
          }
        
        console.error('Refresh endpoint throws undifined error');
        return new Observable<any>(sub => {
          sub.next(null);
          sub.complete();
        });
      })) 
  }
} 