import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';

@Component({
	selector: 'app-plot-points-flow',
	templateUrl: './plot-points-flow.component.html',
	styleUrls: ['./plot-points-flow.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotPointsFlowComponent implements AfterViewInit, OnDestroy  {

	@Input() initialPlotPoints: any[];
	@Input() isDmoFinished: boolean;
	@Input() updateGraph: EventEmitter<any>;
	@Output() plotPointsSet: EventEmitter<any> = new EventEmitter<any>();

	isDataLoaded: boolean = false;
	plotPoints: any[];

	private plotPointContainerSize: number = 32;
	private defaultBeatMarginBottom: number = 16;
	private plotPointRadius: number = 6;
	private initialGraphTopMargin: number = 16;
	
	graphHeigth: string;
	plotFlowWidth: number = 32;
	startCoord: string;
	endCoord: string;
	baseCoord: string;

	private beatIdToMove: any = null;
	private beatIdToReplace: any = null;

	@ViewChildren('plotPoints') plotPointsElements: QueryList<ElementRef>;
	@ViewChildren('plotPointsSvgs') plotPointsSvgElements: QueryList<ElementRef>;

	@ViewChild('plotPointsContainer') plotPointsContainerElement: ElementRef;

	constructor(private cdRef: ChangeDetectorRef) {}

	ngAfterViewInit(): void {
		this.plotPoints = [ ...this.initialPlotPoints];
		this.graphHeigth = this.calculateGraphHeigth(this.plotPoints);
		this.isDataLoaded = true;

		this.renderGraph();
		this.setupEditorCallback();
		this.setupSubscription();
	}

	ngOnDestroy(): void {
		this.initialPlotPoints = [];
		this.isDmoFinished = null;
		this.updateGraph = null;
	}

  	// #region  general settings

	onBeginBeatReorder($event: any): void {
		this.plotPointsContainerElement.nativeElement.classList.add('dragging');
		this.plotPointsSvgElements.forEach(pp => pp.nativeElement.classList.add('ignore-events'));
		$event.dataTransfer.clearData();
		this.beatIdToMove = $event.target.dataset.id;
		this.beatIdToReplace = null;
		$event.dataTransfer.dropEffect = "move";
		$event.dataTransfer.setData("application/beat-id-to-move", $event.target.dataset.id);
	}


	onBeatMove($event: any): void {
		$event.preventDefault();
		$event.dataTransfer.dropEffect = "move";
	}

	onBeatDragHoverBeggin($event: any): void {
		$event.preventDefault();
		$event.dataTransfer.dropEffect = "move";
		if (this.beatIdToMove != $event.target.dataset.id) {
			$event.target.classList.add("droppable");
		} else {
			$event.target.classList.add("dragabble");

		}
	}

	onBeatDragHoverEnd($event: any): void {
		$event.target.classList.remove("droppable");
	}

	onBeatDrop($event: any): void {
		$event.preventDefault();
		if ($event.dataTransfer.getData("application/beat-id-to-move") == $event.target.dataset.id) {
			return;
		}

		this.beatIdToMove = { id: $event.dataTransfer.getData("application/beat-id-to-move")};
		this.beatIdToReplace = { id: $event.target.dataset.id};
	}

	onReoderBeats($event: any): void {
		this.plotPointsSvgElements.forEach(plotPointSvgElement => plotPointSvgElement.nativeElement.classList.remove("ignore-events"));
		this.plotPointsElements.forEach(plotPointElement => {
			plotPointElement.nativeElement.classList.remove("droppable");
			plotPointElement.nativeElement.classList.remove("dragabble");
		});
		this.plotPointsContainerElement.nativeElement.classList.remove("dragging");
		
		if ($event.dataTransfer.dropEffect == "move") {
			if (this.beatIdToMove == null || this.beatIdToReplace == null) {
				return;
			}

			// todo: send request to reorder beats and re-render graph
		} 

		this.beatIdToMove = null;
		this.beatIdToReplace = null;
	}
	

	private setupSubscription(): void {
		this.updateGraph.subscribe(update => {
			if (update.newplotPoints) {
				this.plotPoints = [ ...update.newplotPoints]
			}
			if (update.isFinished !== undefined) {
				this.isDmoFinished = update.isFinished;
			}
			this.graphHeigth = this.calculateGraphHeigth(this.plotPoints);

			this.renderGraph();
			this.setupEditorCallback();
		});
	}

	private renderGraph(): void {
		this.cdRef.detectChanges();
		this.setupPlotPointsMargin();
		this.setupCoord();
		this.cdRef.detectChanges();
	}

  	// #endregion


  	// #region plot points graph
	private setupEditorCallback() {
		this.plotPointsSet.emit({elements: this.plotPointsElements});
	}

	private setupCoord(): void {
		this.startCoord = `0,${this.plotPointContainerSize/2} ${this.plotFlowWidth},${this.plotPointContainerSize/2}`;
		this.endCoord = `0,${this.graphHeigth} ${this.plotFlowWidth},${this.graphHeigth}`;
		this.baseCoord = `${this.plotPointContainerSize/2},${this.plotPointContainerSize/2} ${this.plotPointContainerSize/2},${this.graphHeigth}`;
	}

	private calculateGraphHeigth(plotPoints: any[]): string {
		let heigth: number = 0;
		let allLines: number = 0;
		
		plotPoints.forEach((pp, i) => {
			allLines += pp.plotPointMetaData.lines;
			if (plotPoints.length != i+1) {
				heigth += (this.plotPointContainerSize * pp.plotPointMetaData.lineCount);
				heigth += this.defaultBeatMarginBottom;

				if (pp.plotPointMetaData.lines % 2 != 0 && pp.plotPointMetaData.lines > 2) {
					heigth -= this.defaultBeatMarginBottom;
				}

			} else {
				heigth += this.plotPointContainerSize;
			}
		});

		heigth += this.initialGraphTopMargin;
	
		if (this.isDmoFinished == true) {
			let latsPlotPoint = plotPoints[plotPoints.length - 1].plotPointMetaData;
			heigth += (latsPlotPoint.lineCount * this.plotPointContainerSize);
			heigth += this.initialGraphTopMargin * 2;

			if (latsPlotPoint.lines % 2 != 0 && latsPlotPoint.lines > 2) {
				heigth -= this.defaultBeatMarginBottom;
			}
		}

		return heigth.toString();
	}

	private setupPlotPointsMargin(): void {
		this.plotPointsElements.forEach((plotPoint, i) => {
			let nativeElement = plotPoint.nativeElement.firstChild;
			if (this.plotPoints.find(p => p.beatId === this.selectBeatId(nativeElement))) {
				nativeElement.parentElement.setAttribute('style', `padding-bottom: ${this.calculatePlotPointMargin(i)}px`);
			}
		});
	}

	private selectBeatId(plotPoint: any): string {
		let plotPointSyfix = 'plot_point_';
		return plotPoint.getAttribute('id').substring(plotPointSyfix.length);
	}

	private calculatePlotPointMargin(i: number): number {
		if (this.plotPoints[i].plotPointMetaData.lines == 1 || this.plotPoints[i].plotPointMetaData.lines == 2) {
			return this.defaultBeatMarginBottom;
		}
		return (this.plotPointContainerSize / 2) * (this.plotPoints[i].plotPointMetaData.lines - 2) + this.defaultBeatMarginBottom;
	}

  	// #endregion
}
