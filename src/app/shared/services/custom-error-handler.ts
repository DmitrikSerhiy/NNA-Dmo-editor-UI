import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { throwError } from "rxjs";


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
    
      return throwError({header: 'Unverified error', message: 'Administrator has been notified.'});
    }
  } 