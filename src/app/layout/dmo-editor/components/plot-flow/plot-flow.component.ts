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

  startCoord = "0,0 24,0"
  endCoord = "0, 300, 24, 300";
  someShit = "12,0 12,30";

  private timePickerBoxHeight: number;
  private timePickerHeight: number;

  @Input() timeFlowData: TimeFlowDto;

  constructor() { 
    this.plotFlowWidth = 24;
    this.timePickerBoxHeight = 32;
    this.timePickerHeight = 20;
    this.currentHeight = 0;
  }

  ngOnInit() {
    if (this.timeFlowData.plotPoints.length > 0) {
      
    }
  }

  ngAfterViewInit(): void {
    this.setupTimepickersMargin();


  }

  timeSet($event: TimeFlowPointDto) {
    // console.log('time was changed');
    // console.log($event);
    //todo: change time in timeFlowData and send it to further parent
  }


  private setupTimepickersMargin(): void {
    this.timePickers.forEach((timePicker, i) => {
      let nativeElement = timePicker.timePicker.nativeElement;
      let plotPoint = this.timeFlowData.plotPoints.find(p => p.id === nativeElement.getAttribute('id'));
      if (plotPoint) {
        nativeElement.parentElement.parentElement.setAttribute('style', `margin-top: ${this.getTimepickerContainerMargin(i, plotPoint.lineCount)}px`);
      }
    });
  }

  private getTimepickerContainerMargin(i: number, lineCount: number): number {
    if (lineCount == 1 || i == 0) {
      return 0;
    }

    return this.timePickerBoxHeight * (lineCount - 1);
  }

  private incrementPlotFlowPointHeight(i: number, lineCount: number) {
    
    if (i == 0) {
      this.currentHeight = (this.timePickerBoxHeight / 2);
      return;
    }

    if (lineCount == 1) {
      this.currentHeight += this.timePickerBoxHeight;
      return;
    }


    this.currentHeight += lineCount * this.timePickerBoxHeight;
  }
}
