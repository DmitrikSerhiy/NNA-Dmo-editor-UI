import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { BeatsToSwapDto, BeatToMoveDto, UpdateBeatType } from '../../models/dmo-dtos';
import { computePosition, offset, arrow } from '@floating-ui/dom';
import { NnaTooltipService } from 'src/app/shared/services/nna-tooltip.service';

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
	@Input() openBeatTypeTooltip: EventEmitter<any>;
	@Input() closeBeatTypeTooltip: EventEmitter<any>;
	@Output() plotPointsSet: EventEmitter<any> = new EventEmitter<any>();
	@Output() reorderBeats: EventEmitter<BeatsToSwapDto> = new EventEmitter<BeatsToSwapDto>();
	@Output() updateBeatType: EventEmitter<UpdateBeatType> = new EventEmitter<UpdateBeatType>();
	@Output() focusElementInBeatsFlow: EventEmitter<any> = new EventEmitter<any>();

	isDataLoaded: boolean = false;
	plotPoints: any[];

	private initialBeatType: number;
	private plotPointContainerSize: number = 32;
	private defaultBeatMarginBottom: number = 16;
	private plotPointRadius: number = 6;
	private initialGraphTopMargin: number = 16;

	
	graphHeigth: string;
	plotFlowWidth: number = 32;
	startCoord: string;
	endCoord: string;
	baseCoord: string;

	private beatToMove: BeatToMoveDto = null;
	private beatToReplace: BeatToMoveDto = null;

	private resizeObserver: ResizeObserver 

	private isBeatTypeTooltipShown: boolean = false;
	private elementToFocusAfterClose: any = null;
	private currentBeatIdToChangeBeatType: string;
	private plotPointSyfix = 'plot_point_';
	allowBeatTypeToChange: boolean = true;
	selectedBeatType: number = 1;

	@ViewChildren('plotPoints') plotPointsElements: QueryList<ElementRef>;
	@ViewChildren('plotPointsSvgs') plotPointsSvgElements: QueryList<ElementRef>;	

	@ViewChild('plotPointsContainer') plotPointsContainerElement: ElementRef;
	@ViewChild('beatTypeTooltip') beatTypeTooltipElement: ElementRef;
	@ViewChild('tooltipArrow') tooltipArrowElement: ElementRef;
	
	constructor(
		private cdRef: ChangeDetectorRef, 
		private host: ElementRef,
		private nnaTooltipService: NnaTooltipService) {}

	ngAfterViewInit(): void {
		this.setupPlotPoints();

		this.renderGraph();
		this.setupEditorCallback();
		this.setupSubscription();

		this.applyTooltopStylesStyles();
		this.resizeObserver = new ResizeObserver((entries) => { 
			if (this.isBeatTypeTooltipShown == true) {
				this.hideBeatTypeTooltip()
			}
		});

		this.resizeObserver.observe(this.host.nativeElement);
	}


	ngOnDestroy(): void {
		this.initialPlotPoints = [];
		this.isDmoFinished = null;
		this.updateGraph = null;
		this.resizeObserver.disconnect();
	}


	// #region beatType tooltip

	onBeatTypeChanged(): void {
		this.changeBeatType();
		if (this.selectedBeatType == this.initialBeatType) {
			this.hideBeatTypeTooltip();
			return;
		}
		this.setBeatTypeTooltipClossingDelay();
	}

	private changeBeatType() {
		this.allowBeatTypeToChange = false;
		this.cdRef.detectChanges();
		if (this.selectedBeatType == this.initialBeatType) {
			return;
		}
		this.updateBeatType.emit(new UpdateBeatType(this.currentBeatIdToChangeBeatType, this.selectedBeatType));
	}

	private setBeatTypeTooltipClossingDelay() {
		setTimeout(() => {
			this.hideBeatTypeTooltip();
			this.allowBeatTypeToChange = true;
			this.cdRef.detectChanges();
		}, 250);
	}

	onBeatSvgIconClick(beatIconElement: any, beatId: string): void {
		let beatType;
		this.plotPoints.forEach(beat => {
			if (beat.beatId == beatId) {
				beatType = beat.beatType;
				return;
			}
		});

		this.showBeatTypeTooltip(beatIconElement, beatId, beatType);
	}

	showBeatTypeTooltip(beatIconElement: any, beatId: string, currentBeatType: number, elementToFocusAfterClose: boolean = null): void {
		this.currentBeatIdToChangeBeatType = beatId;
		this.selectedBeatType = +currentBeatType;
		this.initialBeatType = +currentBeatType;
		this.elementToFocusAfterClose = elementToFocusAfterClose;
		this.nnaTooltipService.hideAllTooltips();
		this.cdRef.detectChanges();
		this.subscribeToBeatTypeTooltipKeyboardEvents();
		
		setTimeout(() => { // minor delay before showing tooltip to prevent radio animation on initial open
			this.beatTypeTooltipElement.nativeElement.style.display = 'block';
			this.setTooltipPosition(beatIconElement);
			this.isBeatTypeTooltipShown = true;
			this.cdRef.detectChanges();
		}, 150);
	}

	hideBeatTypeTooltip() {
		this.currentBeatIdToChangeBeatType = '';
		this.beatTypeTooltipElement.nativeElement.style.display = '';
		this.isBeatTypeTooltipShown = false;
		this.allowBeatTypeToChange = true;
		this.resetBeatTypeRadioButtons();

		if (this.elementToFocusAfterClose) {
			this.focusElementInBeatsFlow.emit(this.elementToFocusAfterClose);
		}

		this.elementToFocusAfterClose = null;
		this.unsubscribeFromBeatTypeTooltipKeyboardEvents();
		this.cdRef.detectChanges();
	}

	private resetBeatTypeRadioButtons() {
		this.selectedBeatType = 1;
		this.initialBeatType = 1;
		this.cdRef.detectChanges();
	}
	
	private setTooltipPosition(hostingElement) {
		computePosition(hostingElement, this.beatTypeTooltipElement.nativeElement, {
			placement: 'right',
			middleware: [offset(8), arrow({element: this.tooltipArrowElement.nativeElement})]
		  }).then((callback) =>  this.applyTooltopStylesStyles(callback.x, callback.y, callback.strategy, callback.middlewareData));
	}

	private applyTooltopStylesStyles(x = 0, y = 0, strategy = 'absolute', middlewareData: any = {}) {
		Object.assign(this.beatTypeTooltipElement.nativeElement.style, {
			position: strategy,
			left: `${x}px`,
			top: `${y}px`
		});

		if (middlewareData == null || middlewareData.arrow == null) {
			return;
		}

		Object.assign(this.tooltipArrowElement.nativeElement.style, {
			left: '-5px',
			top: middlewareData.arrow.y != null ? `${middlewareData.arrow.y}px` : '',
			right: '',
			bottom: ''
		 });
	}

	// #endregion





	private handleBeatTypeChangeByKeyboard($event: any): void {
		$event.preventDefault();
		const key = $event.which || $event.keyCode || $event.charCode;
		if (key != 40 && key != 38 && key != 13 && key != 27) { // up and down arrow
			return;
		}
		if (key == 38) { // up
			if (this.selectedBeatType != 1) {
				this.selectedBeatType--;
			}
		} else if (key == 40) { // down
			if (this.selectedBeatType != 4) {
				this.selectedBeatType++;
			}
		}

		this.cdRef.detectChanges(); 
		this.handleBeatTypeTooltipClosing(key);

		console.log('global handler keydown from PLOT POINTS FLOW');
	}

	private handleBeatTypeTooltipClosing(key: number): void {
		if (key == 13) { // enter
			if (this.selectedBeatType == this.initialBeatType) {
				this.hideBeatTypeTooltip();
				return;
			}
			this.changeBeatType();
			this.setBeatTypeTooltipClossingDelay();
		} else if (key == 27) { // esc
			this.hideBeatTypeTooltip();
		}
	}

	private handleBeatTypeChangeByKeyboardWrapper = function name($event) {
		this.handleBeatTypeChangeByKeyboard($event);
	}.bind(this);

	private subscribeToBeatTypeTooltipKeyboardEvents(): void {
		document.addEventListener('keydown', this.handleBeatTypeChangeByKeyboardWrapper);
	}

	private unsubscribeFromBeatTypeTooltipKeyboardEvents(): void {
		document.removeEventListener('keydown', this.handleBeatTypeChangeByKeyboardWrapper);
	}


	//#region beatsReordering
	  
	onBeginBeatReorder($event: any): void {
		this.plotPointsContainerElement.nativeElement.classList.add('dragging');
		this.plotPointsSvgElements.forEach(pp => pp.nativeElement.classList.add('ignore-events'));
		$event.dataTransfer.clearData();
		this.beatToMove = new BeatToMoveDto($event.target.dataset.id, +$event.target.dataset.order);
		this.beatToReplace = null;
		$event.dataTransfer.dropEffect = "move";
		$event.dataTransfer.setData("application/beat-id-to-move", $event.target.dataset.id);
		$event.dataTransfer.setData("application/beat-order-to-move", $event.target.dataset.order);
	}


	onBeatMove($event: any): void {
		$event.preventDefault();
		$event.dataTransfer.dropEffect = "move";
	}

	onBeatDragHoverBeggin($event: any): void {
		$event.preventDefault();
		$event.dataTransfer.dropEffect = "move";
		if (this.beatToMove.id != $event.target.dataset.id) {
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

		this.beatToMove = new BeatToMoveDto($event.dataTransfer.getData("application/beat-id-to-move"), +$event.dataTransfer.getData("application/beat-order-to-move"));
		this.beatToReplace = new BeatToMoveDto($event.target.dataset.id, +$event.target.dataset.order);
	}

	onReoderBeats($event: any): void {
		this.plotPointsSvgElements.forEach(plotPointSvgElement => plotPointSvgElement.nativeElement.classList.remove("ignore-events"));
		this.plotPointsElements.forEach(plotPointElement => {
			plotPointElement.nativeElement.classList.remove("droppable");
			plotPointElement.nativeElement.classList.remove("dragabble");
		});
		this.plotPointsContainerElement.nativeElement.classList.remove("dragging");
		
		if ($event.dataTransfer.dropEffect == "move") {
			if (this.beatToMove == null || this.beatToReplace == null) {
				this.beatToMove = null;
				this.beatToReplace = null;
				return;
			}

			this.reorderBeats.emit(new BeatsToSwapDto(this.beatToMove, this.beatToReplace));
		} 

		this.beatToMove = null;
		this.beatToReplace = null;
	}
	
	//#endregion

	// #region  general settings

	getSvgCanvas(): string {
		return `0 0 ${this.plotPointContainerSize} ${this.plotPointContainerSize}`;
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
			this.cdRef.detectChanges();

			this.renderGraph();
			this.setupEditorCallback();
		});

		this.openBeatTypeTooltip.subscribe($event => {
			this.showBeatTypeTooltip(this.selectPlotPointSvgIconFromBeatId($event.beatId), $event.beatId, $event.beatType, $event.elementToFocusAfterClose);
		});

		this.closeBeatTypeTooltip.subscribe($event => {
			if (this.isBeatTypeTooltipShown == true)
				this.hideBeatTypeTooltip();
		})
	}

	private renderGraph(): void {
		this.cdRef.detectChanges();
		this.setupPlotPointsMargin();
		this.setupCoord();
		this.cdRef.detectChanges();
	}

  	// #endregion


  	// #region plot points graph

	private setupPlotPoints() {
		this.plotPoints = [ ...this.initialPlotPoints];
		this.graphHeigth = this.calculateGraphHeigth(this.plotPoints);
		this.isDataLoaded = true;
		this.cdRef.detectChanges();
	}

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

	private selectBeatIconElement(plotPointElement: any): any {
		return plotPointElement.children[0];
	}

	private calculatePlotPointMargin(i: number): number {
		if (this.plotPoints[i].plotPointMetaData.lines == 1 || this.plotPoints[i].plotPointMetaData.lines == 2) {
			return this.defaultBeatMarginBottom;
		}
		return (this.plotPointContainerSize / 2) * (this.plotPoints[i].plotPointMetaData.lines - 2) + this.defaultBeatMarginBottom;
	}

	private selectPlotPointSvgIconFromBeatId(beatId: string): any {
		let selectedPlotPointSvg;
		this.plotPointsSvgElements.forEach(plotPointSvg => {
			if (beatId == this.selectBeatId(plotPointSvg.nativeElement)) {
				selectedPlotPointSvg = plotPointSvg.nativeElement;
				return;
			}
		})  
		
		return this.selectBeatIconElement(selectedPlotPointSvg)
	}

  	// #endregion
}
