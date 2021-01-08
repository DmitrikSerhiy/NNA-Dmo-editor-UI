import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { PlotPointDirective } from '../../directives/plot-point.directive';
import { TimeDto, TimeFlowDto, TimeFlowPointDto } from '../../models/editorDtos';
import { PlotPointComponent } from '../plot-point/plot-point.component';
import { TimePickerComponent } from '../time-picker/time-picker.component';

@Component({
  selector: 'app-plot-flow',
  templateUrl: './plot-flow.component.html',
  styleUrls: ['./plot-flow.component.scss']
})
export class PlotFlowComponent implements  AfterViewInit  {
  private plotFlowWidth: number;
  private plotPointContainerSize: number;
  private currentHeight: number;
  private timePickerBoxHeight: number;
  private plotPointRadius: number;

  private startCoord = ""
  private endCoord = "";
  private baseCoord = "";

  @Input() timeFlowData: TimeFlowDto;
  @ViewChildren('timePickers') timePickers: QueryList<TimePickerComponent>;
  @ViewChild(PlotPointDirective, {static: false}) plotPointsContainer: PlotPointDirective;
  @ViewChild('lastPickerBox', {static: false}) lastPickerBox: ElementRef;


  constructor(
    private componentFactoryResolver: ComponentFactoryResolver, 
    private cdRef:ChangeDetectorRef) { 
    this.plotFlowWidth = 32;
    this.plotPointContainerSize = 32;
    this.timePickerBoxHeight = 32;
    this.plotPointRadius = 6;
    this.currentHeight = 0;
    this.startCoord = `0,${this.timePickerBoxHeight/2} ${this.plotFlowWidth},${this.timePickerBoxHeight/2}`;
  }

  // ngOnInit() {
  //   if (this.timeFlowData.plotPoints.length > 0) {
      
  //   }
  // }

  ngAfterViewInit(): void {
    this.setupInitialTimepickersMargin();
    this.renderPlotFrowGraph();
    this.renderPlotPoints();
  }

  timeSet($event: TimeFlowPointDto) {
    // console.log($event);
    //todo: change time in timeFlowData and send it to further parent
  }





  private renderPlotPoints(): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(PlotPointComponent);
    const viewContainerRef = this.plotPointsContainer.viewContainerRef;

    this.timeFlowData.plotPoints.forEach((plotPoint, i) => {
      let componentRef = viewContainerRef.createComponent<PlotPointComponent>(componentFactory);
      componentRef.instance.shift = this.setupPlotPointsMargin(plotPoint, i);
      componentRef.instance.radius = this.plotPointRadius;
      componentRef.instance.plotPointContainerSize = this.plotPointContainerSize;
    });

    this.cdRef.detectChanges();
  }

  private renderPlotFrowGraph(): void {
    this.currentHeight = this.timePickerBoxHeight;

    this.timeFlowData.plotPoints.forEach(plotPoint => {
      this.currentHeight += this.timePickerBoxHeight;
      if (plotPoint.lineCount > 1) {
        this.currentHeight = this.currentHeight + (this.timePickerBoxHeight * (plotPoint.lineCount - 1));
      }
    });

    if (this.timeFlowData.isFinished) {
      this.currentHeight += this.timePickerBoxHeight;
    }

    if (this.timeFlowData.isFinished) {
      this.baseCoord = `${this.plotFlowWidth/2},${this.timePickerBoxHeight/2} ${this.plotFlowWidth/2},${this.currentHeight - this.timePickerBoxHeight/2}`;
    } else {
      let lastLineCount = this.timeFlowData.plotPoints[this.timeFlowData.plotPoints.length - 1].lineCount;
      let currentNotFinishedHeight = this.currentHeight - ((lastLineCount * this.plotPointContainerSize) - (this.plotPointContainerSize / 2));
      this.baseCoord = `${this.plotFlowWidth/2},${this.timePickerBoxHeight/2} ${this.plotFlowWidth/2},${currentNotFinishedHeight}`;
    }

    this.endCoord = `0, ${this.currentHeight - this.timePickerBoxHeight/2}, ${this.plotFlowWidth}, ${this.currentHeight - this.timePickerBoxHeight/2}`;

    this.cdRef.detectChanges();
  }

    private setupPlotPointsMargin(plotPoint: TimeFlowPointDto, i: number): number {
      if (i == 0) {
        return this.plotPointContainerSize;
      }

      let previous = this.timeFlowData.plotPoints[i-1];
      if (previous.lineCount > 1) {
        return (this.plotPointContainerSize * previous.lineCount) - this.plotPointContainerSize;
      }

      return 0;
    }

  private setupInitialTimepickersMargin(): void {
    this.timePickers.forEach((timePicker, i) => {
      let nativeElement = timePicker.timePicker.nativeElement;
      let plotPoint = this.timeFlowData.plotPoints.find(p => p.id === nativeElement.getAttribute('id'));
      if (plotPoint) {
        nativeElement.parentElement.parentElement.setAttribute('style', `margin-top: ${this.getTimepickerContainerMargin(i)}px`);
      }
    });

    if (this.timeFlowData.isFinished) {
      let previousLineCount = this.timeFlowData.plotPoints[this.timeFlowData.plotPoints.length - 1].lineCount;
      let lastTimePickerBoxMargine = (previousLineCount * this.timePickerBoxHeight) - this.timePickerBoxHeight;
      this.lastPickerBox.nativeElement.setAttribute('style', `margin-top: ${lastTimePickerBoxMargine}px`);
    }
  }

  private getTimepickerContainerMargin(i: number): number {
    if (i == 0) {
      return 0;
    }

    let previous = this.timeFlowData.plotPoints[i-1];
    return (this.timePickerBoxHeight * previous.lineCount) - this.timePickerBoxHeight;
  }
}
