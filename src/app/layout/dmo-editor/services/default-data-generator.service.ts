import { Injectable } from '@angular/core';
import { UserManager } from 'src/app/shared/services/user-manager';
import { BeatDto, PlotPointDto } from '../models/editorDtos';

@Injectable({
  providedIn: 'root'
})
export class DefaultDataGeneratorService {

  constructor(private userManager: UserManager) { }

  
  // public createPlotPointWithDefaultData(): any {
  //   let defaultPlotPoint = new PlotPointDto();
  //   defaultPlotPoint.id = `default_plotPointId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(10000))}`;
  //   defaultPlotPoint.lineCount = 1;
  //   defaultPlotPoint.order = -1;
  //   defaultPlotPoint.time = new PlotPointDto().getDefaultDto();
    
  //   return { id: defaultPlotPoint.id, order: defaultPlotPoint.order, time: defaultPlotPoint.time, lineCount: defaultPlotPoint.lineCount };
  // }
  
  public createBeatWithDefaultData(): BeatDto {
    let defaultBeatDetails = new BeatDto();
    defaultBeatDetails.beatId = `tempId_${this.userManager.getCurrentUser()}_${Math.floor(Math.random() * Math.floor(1000000))}`;
    defaultBeatDetails.lineCount = 1;
    defaultBeatDetails.beatText = '';
    defaultBeatDetails.order = 1;
    defaultBeatDetails.plotPoint = new PlotPointDto().getDefaultDto();

    return defaultBeatDetails;
    // return { 
    //   beatId: defaultBeatDetails.beatId, 
    //   beatText: defaultBeatDetails.beatText, 
    //   lineCount: defaultBeatDetails.lineCount, 
    //   order: defaultBeatDetails.order,
    //   plotPoint: defaultBeatDetails.plotPoint
    // };
  }
}
