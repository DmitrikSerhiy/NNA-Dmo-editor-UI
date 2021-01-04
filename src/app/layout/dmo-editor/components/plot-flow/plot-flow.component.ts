import { AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { TimeDto, TimeFlowDto, TimeFlowPointDto } from '../../models/editorDtos';
import { TimePickerComponent } from '../time-picker/time-picker.component';

@Component({
  selector: 'app-plot-flow',
  templateUrl: './plot-flow.component.html',
  styleUrls: ['./plot-flow.component.scss']
})
export class PlotFlowComponent implements OnInit, AfterViewInit  {

  @ViewChild('plotFlow', {static: false}) plotFlow: ElementRef;
  @ViewChildren('timePickers') timePickers: QueryList<TimePickerComponent>;
  public context: CanvasRenderingContext2D;

  private plotFlowWidth: number;
  private currentHeight: number;
  private baseLineHeight: number;
  private timePickerHeight: number;
  private beatFlowPointRadius: number;

  @Input() timeFlowData: TimeFlowDto;

  constructor() { 
    this.plotFlowWidth = 24;
    this.baseLineHeight = 32; //2rem
    this.timePickerHeight = 20;
    this.beatFlowPointRadius = 4;
    this.currentHeight = 0;
  }

  ngOnInit() {
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

  timeSet($event: TimeFlowPointDto) {
    // console.log('time was changed');
    // console.log($event);
    //todo: change time in timeFlowData and send it to further parent
  }


  private setupInitialPlotFlow() {
    // === start ===
    this.context.beginPath();
    this.context.lineWidth = 2;
    this.context.moveTo(0, 0);
    this.context.lineTo(this.plotFlowWidth, 0);
    this.context.stroke();
    this.context.closePath();
    // === ===


    this.context.beginPath();
    this.context.lineWidth = 1;
    let xMiddle = this.plotFlowWidth / 2 + 0.5;
    this.context.moveTo(xMiddle, 0);

    for (let i = 0; i < this.timeFlowData.plotPoints.length; i++) {
      this.incrementPlotFlowPointHeight(i, this.timeFlowData.plotPoints[i].lineCount);

      console.log(this.currentHeight);
      this.context.lineTo(xMiddle, this.currentHeight);
      this.context.stroke();
      this.drawBeatFlowPoint(xMiddle, this.currentHeight);
    }

    this.setupTimepickerMargin();
  }

  private setupTimepickerMargin(): void {
    this.timePickers.forEach(timePicker => {
      let nativeElement = timePicker.timePicker.nativeElement;
      let plotPoint = this.timeFlowData.plotPoints.find(p => p.id === nativeElement.getAttribute('id'));
      if (plotPoint) {
        nativeElement.parentElement.parentElement.setAttribute('style', `margin-bottom: ${this.getTimepickerContainerMargin(plotPoint.lineCount)}px`);
      }
    });
  }

  private getTimepickerContainerMargin(lineCount: number): number {
    if (lineCount == 1) {
      return 0;
    }

    return this.baseLineHeight * (lineCount - 1);
  }

  private drawBeatFlowPoint(x: number, y: number) {
    this.context.beginPath();
    this.context.moveTo(x, y);
    this.context.arc(x, y, this.beatFlowPointRadius, 0, 2 * Math.PI, false);
    this.context.fill();
    this.context.closePath();
  }

  private incrementPlotFlowPointHeight(i: number, lineCount: number) {
    if (i == 0) {
      this.currentHeight = (this.baseLineHeight / 2);
      return;
    }

    if (lineCount == 1) {
      this.currentHeight += this.baseLineHeight;
      return;
    }

    console.log(lineCount - 1);
    //fix here
    this.currentHeight += (lineCount - 1) * this.baseLineHeight;
  }
}
