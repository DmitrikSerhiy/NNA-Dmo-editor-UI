import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-plot-points-flow',
  templateUrl: './plot-points-flow.component.html',
  styleUrls: ['./plot-points-flow.component.scss']
})
export class PlotPointsFlowComponent implements  AfterViewInit  {

  @Input() initialPlotPoints: any[]; //{beatId: string, lineCount: number, order: number}
  @Input() isDmoFinished: boolean;
  @Input() updateGraph: EventEmitter<any>;
  @Output() plotPointsSet: EventEmitter<any>;

  isDataLoaded: boolean;
  plotPoints: any[];

  private plotPointContainerSize: number;
  private defaultBeatMarginBottom: number;
  private currentHeight: number;
  private plotPointRadius: number;
  private initialGraphTopMargin: number;
  
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
    this.initialGraphTopMargin = 16;
    this.defaultBeatMarginBottom = 16;
    this.plotPointRadius = 6;
    this.currentHeight = 0;
    this.plotPointsSet = new EventEmitter<any>();
  }


  ngAfterViewInit(): void {
    this.plotPoints = [ ...this.initialPlotPoints]; // remove binding //check out it later maybe use json deserialize
    this.graphHeigth = this.calculateGraphHeigth(this.plotPoints);
    this.isDataLoaded = true;

    this.setupGraph();
    this.setupSubscription();
  }

  private setupSubscription(): void {
    this.updateGraph.subscribe(update => {

      this.plotPoints = [ ...update.newplotPoints]
      this.isDmoFinished = update.isFinished;
      this.graphHeigth = this.calculateGraphHeigth(this.plotPoints)

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
    this.startCoord = `0,${this.plotPointContainerSize/2} ${this.plotFlowWidth},${this.plotPointContainerSize/2}`;
    this.endCoord = `0,${this.graphHeigth} ${this.plotFlowWidth},${this.graphHeigth}`;
    this.baseCoord = `${this.plotPointContainerSize/2},${this.plotPointContainerSize/2} ${this.plotPointContainerSize/2},${this.graphHeigth}`;
  }

  private calculateGraphHeigth(plotPoints: any[]): string {
    let lineCounts: number = 0;
    plotPoints.forEach(pp => {
      lineCounts = lineCounts + pp.plotPointMetaData.newLineCount;
    });
  
    let heigth = (lineCounts * this.plotPointContainerSize) + (lineCounts * this.defaultBeatMarginBottom) + this.initialGraphTopMargin - this.defaultBeatMarginBottom; 
    
    if (this.isDmoFinished) {
      heigth = heigth + this.plotPointContainerSize + this.defaultBeatMarginBottom;
    }

    return heigth.toString();
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
    return (this.plotPointContainerSize * this.plotPoints[i].plotPointMetaData.newLineCount) - this.plotPointContainerSize + this.defaultBeatMarginBottom;
  }


}
