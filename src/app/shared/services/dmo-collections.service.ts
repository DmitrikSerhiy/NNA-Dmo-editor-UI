import { DmoCollectionShortDto, DmoCollectionDto, DmoShortDto, AddDmosToCollectionDto } from './../../layout/models';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';

@Injectable({
  providedIn: 'root'
})
export class DmoCollectionsService {
  serverUrl = environment.server_user + 'dmoCollections/';
  constructor(private http: HttpClient, 
    private errorHandler: CustomErrorHandler) { }

  getCollections(): Observable<DmoCollectionShortDto[]> {
    return this.http
      .get(this.serverUrl)
      .pipe(
        map((response: DmoCollectionShortDto[]) => response),
        catchError(this.errorHandler.handle));
  }

  deleteCollection(collectionId: string): Observable<any> {
    return this.http
      .delete(this.serverUrl, {params: new HttpParams().set('collectionId', collectionId)})
      .pipe(
        map(response => response ),
        catchError(this.errorHandler.handle));
  }

  addCollection(collectionName: string): Observable<any> {
    return this.http
      .post(this.serverUrl, { CollectionName: collectionName })
      .pipe(
        map(response => response ),
        catchError(this.errorHandler.handle));
  }


  updateCollectionName(collectionId: string, newCollectionName: string): Observable<any> {
    return this.http
    .put(this.serverUrl + 'collection/name/', {id: collectionId, collectionName: newCollectionName})
    .pipe(
      map(response => response),
      catchError(this.errorHandler.handle));
  }

  getCollectionName(collectionId: string): Observable<DmoCollectionShortDto> {
    return this.http
    .get(this.serverUrl + 'collection/name/', {params: new HttpParams().set('collectionId', collectionId) })
    .pipe(
      map((response: DmoCollectionShortDto) => response),
      catchError(this.errorHandler.handle));
  }


  getWithDmos(collectionId: string): Observable<DmoCollectionDto> {
    return this.http
      .get(this.serverUrl + 'collection/', {params: new HttpParams().set('collectionId', collectionId) })
      .pipe(
        map((response: DmoCollectionDto) => response),
        catchError(this.errorHandler.handle) );
  }

  addDmosToCollection(addDmosToCollectionDto: AddDmosToCollectionDto) {
    return this.http
    .post(this.serverUrl + 'collection/dmos', addDmosToCollectionDto)
    .pipe(
      map((response: DmoCollectionDto) => response),
      catchError(this.errorHandler.handle) );
  }

  removeFromCollection(dmoId: string, collectionId: string) {
    const params = new HttpParams()
      .set('collectionId', collectionId)
      .set('dmoId', dmoId);
    return this.http
    .delete(this.serverUrl + 'collection/dmos', {params: params })
    .pipe(
      map((response: DmoCollectionDto) => response),
      catchError(this.errorHandler.handle) );
  }

  getExcludedDmos(collectionId: string) {
    const params = new HttpParams()
    .set('collectionId', collectionId)
    .set('excluded', 'true');
  return this.http
  .get(this.serverUrl + 'collection/dmos', {params: params })
  .pipe(
    map((response: DmoShortDto[]) => response),
    catchError(this.errorHandler.handle) );
  }
}
