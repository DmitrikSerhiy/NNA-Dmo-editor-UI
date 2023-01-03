import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { EditorSharedService } from 'src/app/shared/services/editor-shared.service';
import { NnaTooltipService, TooltipOffsetOptions } from 'src/app/shared/services/nna-tooltip.service';

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

	private plotPointContainerSize: number;
	private defaultBeatMarginBottom: number;
	private plotPointRadius: number;
	private initialGraphTopMargin: number;
	plotFlowWidth: number;

	graphHeigth: string;

	startCoord: string;
	endCoord: string;
	baseCoord: string;

	selectedBeatType: number;

	private resizeObserver: ResizeObserver

	@ViewChildren('plotPoints') plotPointsElements: QueryList<ElementRef>;
	@ViewChild('beatTypeTooltip') beatTypeTooltipElement: ElementRef;
	@ViewChild('tooltipArrow') tooltipArrowElement: ElementRef;

	constructor(
		private cdRef: ChangeDetectorRef, 
		private host: ElementRef,
		private nnaTooltipService: NnaTooltipService,
		public editorSharedService: EditorSharedService) {
			this.plotPointContainerSize = editorSharedService.plotPointContainerSize;
			this.defaultBeatMarginBottom = editorSharedService.defaultBeatMarginBottom;
			this.plotPointRadius = editorSharedService.plotPointRadius;
			this.initialGraphTopMargin = editorSharedService.initialGraphTopMargin;
			this.plotFlowWidth = editorSharedService.plotFlowWidth;
		}


	ngAfterViewInit(): void {
		this.setupPlotPoints();
		this.renderGraph();
		this.resizeObserver = new ResizeObserver((entries) => { 
			this.nnaTooltipService.hideTooltip(this.nnaTooltipService.beatTypeReadonlyTooltipName);
		});
		this.resizeObserver.observe(this.host.nativeElement);
	}

	ngOnDestroy(): void {
		this.initialPlotPoints = [];
		this.isDmoFinished = null;
		this.resizeObserver.disconnect();
	}

	onBeatSvgIconClick(beatIconElement: any, beatId: string): void {
		this.plotPoints.forEach(beat => {
			if (beat.beatId == beatId) {
				this.selectedBeatType = beat.beatType;
				return;
			}
		});

		this.nnaTooltipService.addTooltip(
			this.nnaTooltipService.beatTypeReadonlyTooltipName,
			beatIconElement,
			this.beatTypeTooltipElement.nativeElement,
			{ 
				arrowNativeElenemt: this.tooltipArrowElement.nativeElement,
				placement: 'right',
				offset: { mainAxis: 10 } as TooltipOffsetOptions
			}
		);
		
		this.nnaTooltipService.showTooltip(this.nnaTooltipService.beatTypeReadonlyTooltipName);
	}

	private renderGraph(): void {
		this.cdRef.detectChanges();
		this.setupPlotPointsMargin();
		this.setupCoord();
		this.cdRef.detectChanges();
	}

	private setupPlotPoints() {
		this.plotPoints = [ ...this.initialPlotPoints];
		this.graphHeigth = this.editorSharedService.calculateGraphHeigth(this.plotPoints, this.isDmoFinished);
		this.isDataLoaded = true;
		this.cdRef.detectChanges();
	}

	private setupCoord(): void {
		this.startCoord = `0,${this.plotPointContainerSize/2} ${this.plotFlowWidth},${this.plotPointContainerSize/2}`;
		this.endCoord = `0,${this.graphHeigth} ${this.plotFlowWidth},${this.graphHeigth}`;
		this.baseCoord = `${this.plotPointContainerSize/2},${this.plotPointContainerSize/2} ${this.plotPointContainerSize/2},${this.graphHeigth}`;
	}

	private setupPlotPointsMargin(): void {
		this.plotPointsElements.forEach((plotPoint, i) => {
			let nativeElement = plotPoint.nativeElement.firstChild;
			if (this.plotPoints.find(p => p.beatId === this.editorSharedService.selectBeatId(nativeElement))) {
				nativeElement.parentElement.setAttribute('style', `padding-bottom: ${this.calculatePlotPointMargin(i)}px`);
			}
		});
	}

	private calculatePlotPointMargin(i: number): number {
		if (this.plotPoints[i].plotPointMetaData.lines == 1 || this.plotPoints[i].plotPointMetaData.lines == 2) {
			return this.defaultBeatMarginBottom;
		}
		return (this.plotPointContainerSize / 2) * (this.plotPoints[i].plotPointMetaData.lines - 2) + this.defaultBeatMarginBottom;
	}
}