import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';
import { CustomErrorHandler } from 'src/app/shared/services/custom-error-handler';
import { environment } from 'src/environments/environment';
import { PublishedDmosDto } from '../../models';

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
}
