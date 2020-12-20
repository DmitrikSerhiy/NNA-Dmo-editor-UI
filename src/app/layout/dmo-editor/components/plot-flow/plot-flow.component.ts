import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-plot-flow',
  templateUrl: './plot-flow.component.html',
  styleUrls: ['./plot-flow.component.scss']
})
export class PlotFlowComponent implements OnInit, AfterViewInit  {

  @ViewChild('plotFlow', {static: false}) plotFlow: ElementRef;
  public context: CanvasRenderingContext2D;

  private plotFlowWidth: number;
  constructor() { 
    this.plotFlowWidth = 16; //1rem

  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.context = this.plotFlow.nativeElement.getContext('2d');
    this.setupInitialPlotFlow();
  }


  private setupInitialPlotFlow() {
    this.context.beginPath();
    this.context.moveTo(0, 0);
    this.context.lineTo(this.plotFlowWidth, 0);
    this.context.stroke();
  }
}
