import { DmoDto } from './../../layout/models';
import { DmoShortDto } from '../../layout/models';
import { HttpErrorResponse, HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DmosService {
  serverUrl = 'https://localhost:44305/api/dmos/';
  constructor(private http: HttpClient) { }

  getAlldmos(): Observable<DmoShortDto[]> {
    return this.http
      .get(this.serverUrl)
      .pipe(
        map((response: DmoShortDto[]) => response),
        catchError(this.handleError));
  }

  deleteDmo(dmoId: string): Observable<any> {
    return this.http
      .delete(this.serverUrl, {params: new HttpParams().set('dmoId', dmoId)})
      .pipe(
        map(response => response ),
        catchError(this.handleError));
  }

  getDmo(dmoId: string): Observable<DmoDto> {
    return this.http
      .get(this.serverUrl + 'editor', {params: new HttpParams().set('dmoId', dmoId)})
      .pipe(
        map((response: DmoDto) => response ),
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
