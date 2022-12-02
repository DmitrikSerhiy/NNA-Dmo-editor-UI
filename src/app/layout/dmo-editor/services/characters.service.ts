import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Operation } from 'fast-json-patch/module/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';
import { CustomErrorHandler } from 'src/app/shared/services/custom-error-handler';
import { environment } from 'src/environments/environment';
import { NnaMovieCharacterInDmoDto, NnaMovieCharacterToCreateDto } from '../models/dmo-dtos';


@Injectable({
  	providedIn: 'root'
})
export class CharactersService {

 	serverUrl = environment.server_user + 'characters/';

	constructor(
		private http: HttpClient,
		private errorHandler: CustomErrorHandler ) { }

	getCharactersFordmo(dmoId: string): Observable<NnaMovieCharacterInDmoDto[]> {
		return this.http
			.get<NnaMovieCharacterInDmoDto[]>(this.serverUrl + `?dmoId=${dmoId}`)
			.pipe(catchError((response, obs) => this.errorHandler.handle<NnaMovieCharacterInDmoDto[]>(response, obs)));
	}

	createCharacter(characterToCreate: NnaMovieCharacterToCreateDto): Observable<any> {
		return this.http
			.post<any>(this.serverUrl, characterToCreate)
			.pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)));
	}

	updateCharacter(id: string, update: Operation[]): Observable<any> {
		return this.http
			.patch<any>(this.serverUrl + id, update)
			.pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)));
	}

	deleteCharacter(characterId: string): Observable<void> {
		return this.http
			.delete<void>(this.serverUrl, { params: new HttpParams().set('id', characterId) })
			.pipe(catchError((response, obs) => this.errorHandler.handle<void>(response, obs)));
	}
}
