import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { TimeFlowDto, TimeFlowPointDto } from '../../models/editorDtos';

@Component({
  selector: 'app-plot-flow',
  templateUrl: './plot-flow.component.html',
  styleUrls: ['./plot-flow.component.scss']
})
export class PlotFlowComponent implements OnInit, AfterViewInit  {

  @ViewChild('plotFlow', {static: false}) plotFlow: ElementRef;
  public context: CanvasRenderingContext2D;

  private plotFlowWidth: number;
  private lineHeigth: number;
  private beatFlowPointRadius: number;

  @Input() timeFlowData: TimeFlowDto;

  constructor() { 
    this.plotFlowWidth = 24;
    this.lineHeigth = 32;
    this.beatFlowPointRadius = 6;
  }

  ngOnInit() {
    console.log(this.timeFlowData);
    if (this.timeFlowData.plotPoints.length > 0) {

    }
  }

  ngAfterViewInit(): void {
    let canvas = this.plotFlow.nativeElement;
    this.context = canvas.getContext('2d');
    let dpi = window.devicePixelRatio;

    let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);

    this.setupInitialPlotFlow();
  }


  private setupInitialPlotFlow() {
    this.context.beginPath();
    this.context.lineWidth = 3;
    this.context.moveTo(0, 0.5);
    this.context.lineTo(this.plotFlowWidth, 0.5);
    this.context.stroke();

    this.context.lineWidth = 1;
    this.context.moveTo(this.plotFlowWidth / 2 + 0.5, 0);
    this.context.lineTo(this.plotFlowWidth / 2 + 0.5, this.lineHeigth);
    this.context.stroke();

    this.drawBeatFlowPoint(this.plotFlowWidth / 2, this.lineHeigth);
  }

  private drawBeatFlowPoint(x: number, y: number) {
    this.context.moveTo(x, y);
    this.context.arc(x, y, this.beatFlowPointRadius, 0, 2 * Math.PI);
    this.context.fill();
  }
}
