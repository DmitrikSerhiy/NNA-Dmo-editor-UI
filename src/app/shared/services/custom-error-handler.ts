import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { UserDetails } from "../models/serverResponse";


@Injectable({
    providedIn: 'root'
  })
  export class CustomErrorHandler {
      
    constructor() {}

    handle(err: HttpErrorResponse) {
    const error = err.error;
      if (error && error.fromExceptionFilter) {
        return throwError({header: `${error.title} ${error.code}`, message: error.message});
      }

      if (err.status == 422) {
        return new Observable<any>(sub => {
          let failedResult = new UserDetails();
          failedResult.errorMessage = '422';
          sub.next(failedResult);
          sub.complete();
        });
      }

      return throwError({header: 'Unverified error', message: 'Administrator has been notified.'});
    }
  } 