import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { NnaTooltipService } from 'src/app/shared/services/nna-tooltip.service';

@Component({
	selector: 'app-plot-points-flow-readonly',
	templateUrl: './plot-points-flow-readonly.component.html',
	styleUrls: ['./plot-points-flow-readonly.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotPointsFlowReadonlyComponent implements AfterViewInit, OnDestroy  {

	@Input() initialPlotPoints: any[];
	@Input() isDmoFinished: boolean;

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

	// private resizeObserver: ResizeObserver 

	private plotPointSyfix = 'plot_point_';

	@ViewChildren('plotPoints') plotPointsElements: QueryList<ElementRef>;

	constructor(
		private cdRef: ChangeDetectorRef, 
		private host: ElementRef,
		private nnaTooltipService: NnaTooltipService) {}


	ngAfterViewInit(): void {
		this.setupPlotPoints();
		this.renderGraph();

		// this.resizeObserver = new ResizeObserver((entries) => { 
		// 	if (this.isBeatTypeTooltipShown == true) {
		// 		this.hideBeatTypeTooltip()
		// 	}
		// });

		// this.resizeObserver.observe(this.host.nativeElement);
	}


	ngOnDestroy(): void {
		this.initialPlotPoints = [];
		this.isDmoFinished = null;
		// this.resizeObserver.disconnect();
	}

	onBeatSvgIconClick(beatIconElement: any, beatId: string): void {

	}

	preventDrag($event: any): void {
		$event.dataTransfer.dropEffect = 'none';
		$event.preventDefault();
	}

	getSvgCanvas(): string {
		return `0 0 ${this.plotPointContainerSize} ${this.plotPointContainerSize}`;
	}

	private renderGraph(): void {
		this.cdRef.detectChanges();
		this.setupPlotPointsMargin();
		this.setupCoord();
		this.cdRef.detectChanges();
	}

	private setupPlotPoints() {
		this.plotPoints = [ ...this.initialPlotPoints];
		this.graphHeigth = this.calculateGraphHeigth(this.plotPoints);
		this.isDataLoaded = true;
		this.cdRef.detectChanges();
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
			heigth += this.initialGraphTopMargin;

			if (latsPlotPoint.lines % 2 != 0 && latsPlotPoint.lines > 2) {
				heigth -= this.defaultBeatMarginBottom;
			}
		}

		heigth += (2 * plotPoints.length);

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

	private selectBeatId(plotPointElement: any): string {
		return plotPointElement.getAttribute('id').substring(this.plotPointSyfix.length);
	}

	private calculatePlotPointMargin(i: number): number {
		if (this.plotPoints[i].plotPointMetaData.lines == 1 || this.plotPoints[i].plotPointMetaData.lines == 2) {
			return this.defaultBeatMarginBottom;
		}
		return (this.plotPointContainerSize / 2) * (this.plotPoints[i].plotPointMetaData.lines - 2) + this.defaultBeatMarginBottom;
	}
}