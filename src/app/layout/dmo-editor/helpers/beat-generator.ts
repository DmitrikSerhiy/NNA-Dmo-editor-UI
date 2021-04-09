import { Injectable } from '@angular/core';
import { UserManager } from 'src/app/shared/services/user-manager';
import { NnaBeatDto, NnaBeatTimeDto } from '../models/dmo-dtos';
import { BeatDto, PlotPointDto } from '../models/editorDtos';

@Injectable({
  providedIn: 'root'
})
export class BeatGeneratorService {

  constructor(private userManager: UserManager) { }
  
  public createBeatWithDefaultData(): BeatDto {
    let defaultBeatDetails = new BeatDto();
    defaultBeatDetails.beatId = `tempId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(1000000))}`;
    defaultBeatDetails.lineCount = 1;
    defaultBeatDetails.beatText = '';
    defaultBeatDetails.order = 1;
    defaultBeatDetails.plotPoint = new PlotPointDto().getDefaultDto();

    return defaultBeatDetails;
  }

  public createNnaBeatWithDefaultData(): NnaBeatDto {
    let defaultTime = new NnaBeatTimeDto();
    defaultTime.hours = 0;
    defaultTime.minutes = 0;
    defaultTime.seconds = 0;

    let defaultBeatDetails = new NnaBeatDto();
    defaultBeatDetails.beatId = `tempId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(1000000))}`;
    defaultBeatDetails.text = '';
    defaultBeatDetails.order = -1;
    defaultBeatDetails.time = defaultTime;


    return defaultBeatDetails;
  }

  public generateTempBeatId(): string {
    return `tempId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(1000000))}`;
  }
}
