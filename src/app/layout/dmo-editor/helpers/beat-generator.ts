import { Injectable } from '@angular/core';
import { create } from 'domain';
import { UserManager } from 'src/app/shared/services/user-manager';
import { CreateBeatDto, NnaBeatDto, NnaBeatTimeDto } from '../models/dmo-dtos';

@Injectable({
	providedIn: 'root'
})
export class BeatGeneratorService {

	constructor(private userManager: UserManager) { }

	public createNnaBeatWithDefaultData(): NnaBeatDto {
		let defaultTime = new NnaBeatTimeDto();
		defaultTime.hours = 0;
		defaultTime.minutes = 0;
		defaultTime.seconds = 0;

		let defaultBeatDetails = new NnaBeatDto();
		defaultBeatDetails.beatId = `tempId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(9999999))}`;
		defaultBeatDetails.text = '';
		defaultBeatDetails.order = -1;
		defaultBeatDetails.time = defaultTime;
		defaultBeatDetails.type = 1;

		return defaultBeatDetails;
	}

	public generateTempId(): string {
		return `tempId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(9999999))}`;
	}

	public getCreatedBeatDto(created: NnaBeatDto, dmoId: string): CreateBeatDto {
		return {
			tempId: created.beatId,
			order: created.order,
			dmoId: dmoId
		} as CreateBeatDto;
	}
}
