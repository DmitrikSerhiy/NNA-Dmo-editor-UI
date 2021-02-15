import { EventEmitter, Output } from '@angular/core';
import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef, Input, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { PlotPointDirective } from '../../directives/plot-point.directive';
import { BeatDto, DmoDto } from '../../models/editorDtos';
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

  @Input() currentDmo: DmoDto;

  @Input() finishDMO: EventEmitter<any>;
  @Input() reRender: EventEmitter<void>;
  @Output() plotPointChanged: EventEmitter<any>;

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
    this.plotPointChanged = new EventEmitter();
  }

  ngAfterViewInit(): void {
    this.setupInitialTimepickersMargin();
    this.renderPlotFrowGraph();
    this.renderPlotPoints();

    this.finishDMO.subscribe(_ => {
      this.renderPlotFrowGraph();
      this.renderPlotPoints();
    });

    this.reRender.subscribe(data => {
      this.setupInitialTimepickersMargin();
      this.renderPlotFrowGraph();
      this.renderPlotPoints();

      if (data) {
        this.focusNextTimePicker(data.fromBeat);
      }
    })
  }

  timeSet($event: any) {
    this.plotPointChanged.emit($event);
  }


  private focusNextTimePicker(beatId: string) {
    let currBeat = this.currentDmo.getBeatsAsLinkedList().search(b => b.beatId == beatId);
    if (!currBeat) {
      return;
    }
    
    this.timePickers.forEach(picker => {
      let nativeElement = picker.timePicker.nativeElement;
      if (`timePicker_${currBeat.next.data.beatId}` === nativeElement.getAttribute('id')) {;
        nativeElement.value = '';
        nativeElement.focus();
        return;
      }

    });
  }
  
  private renderPlotPoints(): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(PlotPointComponent);
    const viewContainerRef = this.plotPointsContainer.viewContainerRef;

    viewContainerRef.clear();
    this.currentDmo.beats.forEach((beatDto, i) => {
      let componentRef = viewContainerRef.createComponent<PlotPointComponent>(componentFactory);
      componentRef.instance.shift = this.setupPlotPointsMargin(i);
      componentRef.instance.radius = this.plotPointRadius;
      componentRef.instance.plotPointContainerSize = this.plotPointContainerSize;
      componentRef.instance.plotPointData = beatDto;
    });

    this.cdRef.detectChanges();
  }

  private renderPlotFrowGraph(): void {
    this.currentHeight = this.timePickerBoxHeight;

    this.currentDmo.beats.forEach(beatDto => {
      this.currentHeight += this.timePickerBoxHeight;
      if (beatDto.lineCount > 1) {
        this.currentHeight = this.currentHeight + (this.timePickerBoxHeight * (beatDto.lineCount - 1));
      }
    });

    if (this.currentDmo.isFinished) {
      this.currentHeight += this.timePickerBoxHeight;
    }

    if (this.currentDmo.isFinished) {
      this.baseCoord = `${this.plotFlowWidth/2},${this.timePickerBoxHeight/2} ${this.plotFlowWidth/2},${this.currentHeight - this.timePickerBoxHeight/2}`;
    } else {
      let lastLineCount = this.currentDmo.beats[this.currentDmo.beats.length - 1].lineCount;
      let currentNotFinishedHeight = this.currentHeight - ((lastLineCount * this.plotPointContainerSize) - (this.plotPointContainerSize / 2));
      this.baseCoord = `${this.plotFlowWidth/2},${this.timePickerBoxHeight/2} ${this.plotFlowWidth/2},${currentNotFinishedHeight}`;
    }

    this.endCoord = `0, ${this.currentHeight - this.timePickerBoxHeight/2}, ${this.plotFlowWidth}, ${this.currentHeight - this.timePickerBoxHeight/2}`;

    this.cdRef.detectChanges();
  }

  private setupPlotPointsMargin(i: number): number {
    if (i == 0) {
      return this.plotPointContainerSize;
    }

    let previous = this.currentDmo.beats[i-1];
    if (previous.lineCount > 1) {
      return (this.plotPointContainerSize * previous.lineCount) - this.plotPointContainerSize;
    }

    return 0;
  }

  private setupInitialTimepickersMargin(): void {
    this.timePickers.forEach((timePicker, i) => {
      let nativeElement = timePicker.timePicker.nativeElement;
      let beatDto = this.currentDmo.beats.find(p => `plotPoint_${p.beatId}` === nativeElement.getAttribute('id'));
      if (beatDto) {
        nativeElement.parentElement.parentElement.setAttribute('style', `margin-top: ${this.getTimepickerContainerMargin(i)}px`);
      }
    });

    if (this.currentDmo.isFinished) {
      let previousLineCount = this.currentDmo.beats[this.currentDmo.beats.length - 1].lineCount;
      let lastTimePickerBoxMargine = (previousLineCount * this.timePickerBoxHeight) - this.timePickerBoxHeight;
      this.lastPickerBox.nativeElement.setAttribute('style', `margin-top: ${lastTimePickerBoxMargine}px`);
    }
  }

  private getTimepickerContainerMargin(i: number): number {
    if (i == 0) {
      return 0;
    }

    let previous = this.currentDmo.beats[i-1];
    return (this.timePickerBoxHeight * previous.lineCount) - this.timePickerBoxHeight;
  }
}
