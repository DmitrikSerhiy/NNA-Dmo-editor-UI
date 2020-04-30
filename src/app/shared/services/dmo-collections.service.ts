import { DmoCollectionShortDto, DmoCollectionDto, DmoShortDto, AddDmosToCollectionDto } from './../../layout/models';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DmoCollectionsService {
  serverUrl = environment.server_user + 'dmoCollections/';
  constructor(private http: HttpClient) { }

  getCollections(): Observable<DmoCollectionShortDto[]> {
    return this.http
      .get(this.serverUrl)
      .pipe(
        map((response: DmoCollectionShortDto[]) => response),
        catchError(this.handleError));
  }

  deleteCollection(collectionId: string): Observable<any> {
    return this.http
      .delete(this.serverUrl, {params: new HttpParams().set('collectionId', collectionId)})
      .pipe(
        map(response => response ),
        catchError(this.handleError));
  }

  addCollection(collectionName: string): Observable<any> {
    return this.http
      .post(this.serverUrl, { CollectionName: collectionName })
      .pipe(
        map(response => response ),
        catchError(this.handleError));
  }


  updateCollectionName(collectionId: string, newCollectionName: string): Observable<any> {
    return this.http
    .put(this.serverUrl + 'collection/name/', {id: collectionId, collectionName: newCollectionName})
    .pipe(
      map(response => response),
      catchError(this.handleError));
  }

  getCollectionName(collectionId: string): Observable<DmoCollectionShortDto> {
    return this.http
    .get(this.serverUrl + 'collection/name/', {params: new HttpParams().set('collectionId', collectionId) })
    .pipe(
      map((response: DmoCollectionShortDto) => response),
      catchError(this.handleError));
  }


  getWithDmos(collectionId: string): Observable<DmoCollectionDto> {
    return this.http
      .get(this.serverUrl + 'collection/', {params: new HttpParams().set('collectionId', collectionId) })
      .pipe(
        map((response: DmoCollectionDto) => response),
        catchError(this.handleError) );
  }

  addDmosToCollection(addDmosToCollectionDto: AddDmosToCollectionDto) {
    return this.http
    .post(this.serverUrl + 'collection/dmos', addDmosToCollectionDto)
    .pipe(
      map((response: DmoCollectionDto) => response),
      catchError(this.handleError) );
  }

  removeFromCollection(dmoId: string, collectionId: string) {
    const params = new HttpParams()
      .set('collectionId', collectionId)
      .set('dmoId', dmoId);
    return this.http
    .delete(this.serverUrl + 'collection/dmos', {params: params })
    .pipe(
      map((response: DmoCollectionDto) => response),
      catchError(this.handleError) );
  }

  getExcludedDmos(collectionId: string) {
    const params = new HttpParams()
    .set('collectionId', collectionId)
    .set('excluded', 'true');
  return this.http
  .get(this.serverUrl + 'collection/dmos', {params: params })
  .pipe(
    map((response: DmoShortDto[]) => response),
    catchError(this.handleError) );
  }

  private handleError(err: HttpErrorResponse) {
    const errorMessage = err.error.errorMessage;
    if (!errorMessage) {
      return throwError('Server error. Try later.');
    }

    return throwError(errorMessage);
  }
}
