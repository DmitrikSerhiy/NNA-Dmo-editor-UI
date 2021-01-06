import { Component } from '@angular/core';

@Component({
  selector: 'app-plot-point',
  templateUrl: './plot-point.component.html',
  styleUrls: ['./plot-point.component.scss']
})
export class PlotPointComponent {

  private radius;
  private plotPointContainerSize: number;

  constructor() { 
    this.radius  = 4;
    this.plotPointContainerSize = 24;
  }

}
