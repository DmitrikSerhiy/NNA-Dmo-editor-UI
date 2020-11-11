import { DmoDto, ShortDmoDto } from './../../layout/models';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';

@Injectable({
  providedIn: 'root'
})
export class DmosService {
  serverUrl = environment.server_user + 'dmos/';
  constructor(private http: HttpClient,
    private errorHandler: CustomErrorHandler) { }

  getAlldmos(): Observable<ShortDmoDto[]> {
    return this.http
      .get(this.serverUrl)
      .pipe(
        map((response: ShortDmoDto[]) => response),
        catchError(this.errorHandler.handle));
  }

  deleteDmo(dmoId: string): Observable<any> {
    return this.http
      .delete(this.serverUrl, {params: new HttpParams().set('dmoId', dmoId)})
      .pipe(
        map(response => response ),
        catchError(this.errorHandler.handle));
  }

  getDmo(dmoId: string): Observable<DmoDto> {
    return this.http
      .get(this.serverUrl + 'editor', {params: new HttpParams().set('dmoId', dmoId)})
      .pipe(
        map((response: DmoDto) => response ),
        catchError(this.errorHandler.handle));
  }
}
