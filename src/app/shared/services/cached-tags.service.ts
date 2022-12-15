import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/internal/operators/catchError';
import { CachedNnaTagDescriptionDto, NnaTagDescriptionDto, NnaTagWithoutDescriptionDto } from 'src/app/layout/models';
import { environment } from 'src/environments/environment';
import { CustomErrorHandler } from './custom-error-handler';

@Injectable({
	providedIn: 'root'
})
export class CachedTagsService {
	serverUrl = environment.server_user + 'tags/';
	private cachedTags: NnaTagWithoutDescriptionDto[] = [];
	private cachedTagsDescription: CachedNnaTagDescriptionDto[] = [];


	constructor(		
		private http: HttpClient,
		private errorHandler: CustomErrorHandler) { }

	async getAllTags(): Promise<NnaTagWithoutDescriptionDto[]> {
		if (this.cachedTags.length) {
			return this.cachedTags;
		}

		this.cachedTags = await this.http
			.get<NnaTagWithoutDescriptionDto[]>(this.serverUrl)
			.pipe(catchError((response, obs) => this.errorHandler.handle<NnaTagWithoutDescriptionDto[]>(response, obs)))
			.toPromise();
		
		return this.cachedTags;
	}

	
	async getTagDescription(id: string): Promise<NnaTagDescriptionDto> {
		if (this.cachedTagsDescription.some(ct => ct.id == id)) {
			return { description: this.cachedTagsDescription.find(ct => ct.id == id).description } as NnaTagDescriptionDto;
		}

		let newDescription = await this.http
			.get<NnaTagDescriptionDto>(this.serverUrl + id)
			.pipe(catchError((response, obs) => this.errorHandler.handle<NnaTagDescriptionDto>(response, obs)))
			.toPromise();

		this.cachedTagsDescription.push({ id: id, description: newDescription.description } as CachedNnaTagDescriptionDto)
		return  { description: newDescription.description } as NnaTagDescriptionDto;
	}
}
