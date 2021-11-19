import { DmoDto, ShortDmoDto } from './../../layout/models';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';

@Injectable({
  providedIn: 'root'
})
export class DmosService {
  serverUrl = environment.server_user + 'dmos/';

  constructor(
    private http: HttpClient,
    private errorHandler: CustomErrorHandler ) { }

  getAlldmos(): Observable<ShortDmoDto[]> {
    return this.http
      .get<ShortDmoDto[]>(this.serverUrl)
      .pipe(catchError((response, obs) => this.errorHandler.handle<ShortDmoDto[]>(response, obs)));
  }

  deleteDmo(dmoId: string): Observable<any> {
    return this.http
      .delete<any>(this.serverUrl, {params: new HttpParams().set('dmoId', dmoId)})
      .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)));

  }

  getDmo(dmoId: string): Observable<DmoDto> {
    return this.http
      .get<DmoDto>(this.serverUrl + 'editor', {params: new HttpParams().set('dmoId', dmoId)})
      .pipe(catchError((response, obs) => this.errorHandler.handle<DmoDto>(response, obs)));
  }

}
