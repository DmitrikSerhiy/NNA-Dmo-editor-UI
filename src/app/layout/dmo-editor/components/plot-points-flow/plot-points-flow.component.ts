import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-plot-points-flow',
  templateUrl: './plot-points-flow.component.html',
  styleUrls: ['./plot-points-flow.component.scss']
})
export class PlotPointsFlowComponent implements  AfterViewInit  {

  @Input() initialPlotPoints: any[]; //{beatId: string, lineCount: number, order: number}
  @Input() isDmoFinished: boolean;
  @Input() initialGraphHeigth: string;
  @Input() updateGraph: EventEmitter<any>;
  @Output() plotPointsSet: EventEmitter<any>;

  isDataLoaded: boolean;
  plotPoints: any[];
  

  private plotPointContainerSize: number;
  private currentHeight: number;
  private timePickerBoxHeight: number;
  private plotPointRadius: number;
  
  graphHeigth: string;
  plotFlowWidth: number;
  startCoord: string;
  endCoord: string;
  baseCoord: string;

  @ViewChildren('plotPoints') plotPointsElements: QueryList<ElementRef>;



  constructor(private cdRef: ChangeDetectorRef) { 
    this.isDataLoaded = false;

    this.plotFlowWidth = 32;
    this.plotPointContainerSize = 32;
    this.timePickerBoxHeight = 32;
    this.plotPointRadius = 6;
    this.currentHeight = 0;
    this.plotPointsSet = new EventEmitter<any>();
  }


  ngAfterViewInit(): void {
    this.plotPoints = [ ...this.initialPlotPoints]; // remove binding //check out it later maybe use json deserialize
    this.graphHeigth = this.initialGraphHeigth;
    this.isDataLoaded = true;
    // console.log(this.plotPoints);

    this.setupGraph();
    this.setupSubscription();
  }


  private setupSubscription(): void {
    this.updateGraph.subscribe(update => {

      this.plotPoints = [ ...update.newplotPoints]
      this.isDmoFinished = update.isFinished;
      this.graphHeigth = update.graphHeigth;

      this.setupGraph();
    });
  }

  private setupGraph(): void {
    this.cdRef.detectChanges();
    this.setupPlotPointsMargin();
    this.setupCoord();
    this.cdRef.detectChanges();
    this.plotPointsSet.emit({elements: this.plotPointsElements});
  }

  private setupCoord(): void {
    this.startCoord = `0,${this.timePickerBoxHeight/2} ${this.plotFlowWidth},${this.timePickerBoxHeight/2}`;
    this.endCoord = `0,${this.graphHeigth} ${this.plotFlowWidth},${this.graphHeigth}`;
    this.baseCoord = `${this.timePickerBoxHeight/2},${this.timePickerBoxHeight/2} ${this.timePickerBoxHeight/2},${this.graphHeigth}`;
  }

  private setupPlotPointsMargin(): void {
    this.plotPointsElements.forEach((plotPoint, i) => {
      let nativeElement = plotPoint.nativeElement.firstChild;
      if (this.plotPoints.find(p => p.beatId === this.selectBeatId(nativeElement))) {
        nativeElement.parentElement.setAttribute('style', `margin-bottom: ${this.calculatePlotPointMargin(i)}px`);
      }
    });
  }

  private selectBeatId(plotPoint: any): string {
    let plotPointSyfix = 'plot_point_';
    return plotPoint.getAttribute('id').substring(plotPointSyfix.length);
  }

  private calculatePlotPointMargin(i: number): number {
    return this.timePickerBoxHeight * this.plotPoints[i].lineCount - this.timePickerBoxHeight;
  }


}
