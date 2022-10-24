import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';
import { CustomErrorHandler } from 'src/app/shared/services/custom-error-handler';
import { environment } from 'src/environments/environment';
import { NnaMovieCharacterDto, NnaMovieCharacterToCreateDto, NnaMovieCharacterToUpdateDto } from '../models/dmo-dtos';


@Injectable({
  	providedIn: 'root'
})
export class CharactersService {

 	serverUrl = environment.server_user + 'characters/';

	constructor(
		private http: HttpClient,
		private errorHandler: CustomErrorHandler ) { }

	getCharactersFordmo(dmoId: string): Observable<NnaMovieCharacterDto[]> {
		return this.http
			.get<NnaMovieCharacterDto[]>(this.serverUrl + `?dmoId=${dmoId}`)
			.pipe(catchError((response, obs) => this.errorHandler.handle<NnaMovieCharacterDto[]>(response, obs)));
	}

	createCharacter(characterToCreate: NnaMovieCharacterToCreateDto): Observable<any> {
		return this.http
			.post<any>(this.serverUrl, characterToCreate)
			.pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)));
	}

	updateCharacter(characterToUpdate: NnaMovieCharacterToUpdateDto): Observable<any> {
		return this.http
			.put<any>(this.serverUrl, characterToUpdate)
			.pipe(catchError((response, obs) => this.errorHandler.handle<any>(response, obs)));
	}

	deleteCharacter(characterId: string): Observable<void> {
		return this.http
			.delete<void>(this.serverUrl, { params: new HttpParams().set('id', characterId) })
			.pipe(catchError((response, obs) => this.errorHandler.handle<void>(response, obs)));
	}
}
