import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/internal/operators/catchError';
import { NnaTagDto, NnaTagWithoutDescriptionDto } from 'src/app/layout/models';
import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';

@Injectable({
	providedIn: 'root'
})
export class CachedTagsService {
	serverUrl = environment.server_user + 'tags/';
	private cachedTagList: NnaTagWithoutDescriptionDto[] = [];
	private cachedTagsWithDescription: NnaTagDto[] = [];


	constructor(		
		private http: HttpClient,
		private errorHandler: CustomErrorHandler) { }

	async getAllTags(): Promise<NnaTagWithoutDescriptionDto[]> {
		if (this.cachedTagList.length) {
			return this.cachedTagList;
		}

		this.cachedTagList = await this.http
			.get<NnaTagWithoutDescriptionDto[]>(this.serverUrl)
			.pipe(catchError((response, obs) => this.errorHandler.handle<NnaTagWithoutDescriptionDto[]>(response, obs)))
			.toPromise<NnaTagWithoutDescriptionDto[]>();
		
		return this.cachedTagList;
	}

	
	async getTag(id: string): Promise<NnaTagDto> {
		let cachedTag = this.cachedTagsWithDescription.find(ct => ct.id == id);
		if (cachedTag) {
			return cachedTag;
		}

		let loadedTag = await this.http
			.get<NnaTagDto>(this.serverUrl + id)
			.pipe(catchError((response, obs) => this.errorHandler.handle<NnaTagDto>(response, obs)))
			.toPromise<NnaTagDto>();

		this.cachedTagsWithDescription.push(loadedTag);
		return loadedTag;
	}
}
