import { DmoCollectionShortDto, DmoCollectionDto, AddDmosToCollectionDto, ShortDmoDto } from './../../layout/models';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';

@Injectable({
  providedIn: 'root'
})
export class DmoCollectionsService {
  serverUrl = environment.server_user + 'dmoCollections/';

  constructor(
    private http: HttpClient, 
    private errorHandler: CustomErrorHandler) { }

  getCollections(): Observable<DmoCollectionShortDto[]> {
    return this.http
      .get<DmoCollectionShortDto[]>(this.serverUrl)
      .pipe(catchError((response, obs) => this.errorHandler.handle<DmoCollectionShortDto[]>(response, obs)) );
  }

  deleteCollection(collectionId: string): Observable<any> {
    return this.http
      .delete<any>(this.serverUrl, {params: new HttpParams().set('collectionId', collectionId)})
      .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)) )
  }

  addCollection(collectionName: string): Observable<any> {
    return this.http
      .post<any>(this.serverUrl, { CollectionName: collectionName })
      .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)));
  }


  updateCollectionName(collectionId: string, newCollectionName: string): Observable<any> {
    return this.http
      .put<any>(this.serverUrl + 'collection/name/', {id: collectionId, collectionName: newCollectionName})
      .pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)));
  }

  getCollectionName(collectionId: string): Observable<DmoCollectionShortDto> {
    return this.http
      .get<DmoCollectionShortDto>(this.serverUrl + 'collection/name/', {params: new HttpParams().set('collectionId', collectionId) })
      .pipe(catchError((response, obs) => this.errorHandler.handle<DmoCollectionShortDto>(response, obs)));
  }


  getWithDmos(collectionId: string): Observable<DmoCollectionDto> {
    return this.http
      .get<DmoCollectionDto>(this.serverUrl + 'collection/', {params: new HttpParams().set('collectionId', collectionId) })
      .pipe(catchError((response, obs) => this.errorHandler.handle<DmoCollectionDto>(response, obs)));
  }

  addDmosToCollection(addDmosToCollectionDto: AddDmosToCollectionDto): Observable<DmoCollectionDto> {
    return this.http
      .post<DmoCollectionDto>(this.serverUrl + 'collection/dmos', addDmosToCollectionDto)
      .pipe(catchError((response, obs) => this.errorHandler.handle<DmoCollectionDto>(response, obs)));
  }

  removeFromCollection(dmoId: string, collectionId: string): Observable<DmoCollectionDto> {
    const params = new HttpParams()
      .set('collectionId', collectionId)
      .set('dmoId', dmoId);

    return this.http
      .delete<DmoCollectionDto>(this.serverUrl + 'collection/dmos', { params: params })
      .pipe(catchError((response, obs) => this.errorHandler.handle<DmoCollectionDto>(response, obs)));
  }

  getExcludedDmos(collectionId: string): Observable<ShortDmoDto[]> {
    const params = new HttpParams()
    .set('collectionId', collectionId)
    .set('excluded', 'true');

  return this.http
    .get<ShortDmoDto[]>(this.serverUrl + 'collection/dmos', {params: params })
    .pipe(catchError((response, obs) => this.errorHandler.handle<ShortDmoDto[]>(response, obs)));
  }

}
