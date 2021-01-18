import { Injectable } from '@angular/core';
import { UserManager } from 'src/app/shared/services/user-manager';
import { BeatDetailsDto, PlotPointDto, TimeDto } from '../models/editorDtos';

@Injectable({
  providedIn: 'root'
})
export class DefaultDataGeneratorService {

  constructor(private userManager: UserManager) { }

  
  public createPlotPointWithDefaultData(): any {
    let defaultPlotPoint = new PlotPointDto();
    defaultPlotPoint.id = `default_plotPointId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(10000))}`;
    defaultPlotPoint.lineCount = 1;
    defaultPlotPoint.order = -1;
    defaultPlotPoint.time = new TimeDto().getDefaultDto();
    
    return { id: defaultPlotPoint.id, order: defaultPlotPoint.order, time: defaultPlotPoint.time, lineCount: defaultPlotPoint.lineCount };
  }
  
  public createBeatWithDefaultData(): any {
    let defaultBeatDetails = new BeatDetailsDto();
    defaultBeatDetails.id = `default_beatId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(10000))}`;
    defaultBeatDetails.lineCount = 1;
    defaultBeatDetails.text = '';
    defaultBeatDetails.order = -1;

    return { id: defaultBeatDetails.id, text: defaultBeatDetails.text, lineCount: defaultBeatDetails.lineCount, order: defaultBeatDetails.order };
  }
}
