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

	private beatToMove: any = {};
	private beatToReplace: any = {};

	@ViewChildren('plotPoints') plotPointsElements: QueryList<ElementRef>;
	@ViewChild('plotPointsContainer') plotPointsContainerElement: ElementRef;

	constructor(private cdRef: ChangeDetectorRef) {}

	ngAfterViewInit(): void {
		this.plotPoints = [ ...this.initialPlotPoints]; // remove binding. check out it later maybe use json deserialize
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

	onBeginBeatReorder($event: any, beatIdToMove: string, beatOrderToMove: number): void {
		this.plotPointsContainerElement.nativeElement.classList.add('dragging');
		$event.dataTransfer.clearData();
		this.beatToMove = {};
		this.beatToReplace = {};
		$event.dataTransfer.dropEffect = "move";
		$event.dataTransfer.setData("application/beat-id-to-move", beatIdToMove);
		$event.dataTransfer.setData("application/beat-order-to-move", beatOrderToMove);

		// todo: set some global backgroud
		// todo: limit horizontal graggin withing graph container
	}


	onBeatMove($event: any): void {
		$event.preventDefault();
		$event.dataTransfer.dropEffect = "move";
		// todo: add style to graggable plotpoint

	}

	onBeatDragHoverBeggin($event: any): void {
		$event.preventDefault();
		$event.dataTransfer.dropEffect = "move";
	}

	onBeatDragHoverEnd($event: any): void {

	}

	onBeatDrop($event: any, beatIdToReplace: string, beatOrderToReplace: number): void {
		$event.preventDefault();
		console.log('drop');
		this.beatToMove = { id: $event.dataTransfer.getData("application/beat-id-to-move"), order: +$event.dataTransfer.getData("application/beat-order-to-move")};
		this.beatToReplace = { id: beatIdToReplace, order: beatOrderToReplace};
		if (this.beatToMove.order == this.beatToReplace.order) {
			return;
		}
	}

	onReoderBeats($event: any): void {
		if ($event.dataTransfer.dropEffect == "move") {
			console.log('reorder success');
			
			console.log('from:');
			console.log(this.beatToMove);
			console.log('to:');
			console.log(this.beatToReplace);
			// todo: send request to reorder beats and re-render graph
		} 
		// todo: $event.target.classList.remove("dragging");
		// todo: remove background
		this.beatToMove = {};
		this.beatToReplace = {};
		this.plotPointsContainerElement.nativeElement.classList.remove('dragging');

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
