import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PlotPointDto } from '../../models/editorDtos';

@Component({
  selector: 'app-plot-point',
  templateUrl: './plot-point.component.html',
  styleUrls: ['./plot-point.component.scss']
})
export class PlotPointComponent implements OnInit {

  private margin: string;
  private isPlotPointToolsIconVisible = false;
  @ViewChild('plotPointContainer', {static: true}) plotPointContainer: ElementRef;

  public shift: number;
  public radius : number;
  public plotPointContainerSize: number;
  public plotPointData: PlotPointDto;

  constructor() { }
  
  ngOnInit(): void {
    if (!this.shift) {
      this.margin = 'margin-top: 0';
    } else {
      this.margin = `margin-top: ${this.shift}px`;
    }

    this.plotPointContainer.nativeElement.setAttribute('style', this.margin);
  }

  toggleToolsIcon(command: boolean) {
    this.isPlotPointToolsIconVisible = command;
  }

}
