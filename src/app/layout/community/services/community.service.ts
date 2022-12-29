import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';
import { take } from 'rxjs/internal/operators/take';
import { CustomErrorHandler } from 'src/app/shared/services/custom-error-handler';
import { environment } from 'src/environments/environment';
import { PublishedDmoDetails, PublishedDmosDto, PublishedDmoShortDto } from '../../models';

@Injectable({
	providedIn: 'root'
})
export class CommunityService {

	private serverUrl = environment.server_user + 'community/';
	
	constructor(		
		private http: HttpClient,
		private errorHandler: CustomErrorHandler ) { }

	getPagedDmos(pageNumber: number, pageSize: number): Observable<PublishedDmosDto> {
		return this.http
			.get<PublishedDmosDto>(this.serverUrl + 'dmos' + `?pageNumber=${pageNumber}&pageSize=${pageSize}`)
			.pipe(catchError((response, obs) => this.errorHandler.handle<PublishedDmosDto>(response, obs)));
	}

	getPublishedDmoDetails(id: string): Observable<PublishedDmoDetails> {
		return this.http
			.get<PublishedDmoDetails>(this.serverUrl + 'dmos/' + id + '/details')
			.pipe(take(1), catchError((response, obs) => this.errorHandler.handle<PublishedDmoDetails>(response, obs)));
	}

	getPublishedDmoAmountBySearch(searchBy: string, dmoIdsToIgnore: string[]): Observable<number> {
		return this.http
			.post<number>(this.serverUrl + 'dmos/search/amount?searchBy=' + searchBy, {dmoIdsToIgnore:  dmoIdsToIgnore})
			.pipe(take(1), catchError((response, obs) => this.errorHandler.handle<number>(response, obs)));
	}

	getPublishedDmoBySearch(searchBy: string, dmoIdsToIgnore: string[], amount: number): Observable<PublishedDmoShortDto[]> {
		return this.http
			.post<PublishedDmoShortDto[]>(this.serverUrl + 'dmos/search/data/?searchBy=' + searchBy, { dmoIdsToIgnore: dmoIdsToIgnore, amount: amount })
			.pipe(catchError((response, obs) => this.errorHandler.handle<PublishedDmoShortDto[]>(response, obs)));
	}
}
