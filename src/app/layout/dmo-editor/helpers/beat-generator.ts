import { Injectable } from '@angular/core';
import { UserManager } from 'src/app/shared/services/user-manager';
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
}
