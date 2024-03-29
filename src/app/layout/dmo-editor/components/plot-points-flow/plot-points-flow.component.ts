import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { BeatToMoveDto, BeatsToSwapDto, BeatToSwapDto, UpdateBeatType } from '../../models/dmo-dtos';
import { NnaTooltipService, TooltipOffsetOptions } from 'src/app/shared/services/nna-tooltip.service';
import { EditorSharedService } from 'src/app/shared/services/editor-shared.service';

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
	@Output() plotPointsSet: EventEmitter<any> = new EventEmitter<any>();
	@Output() reorderBeats: EventEmitter<any> = new EventEmitter<any>();
	@Output() updateBeatType: EventEmitter<UpdateBeatType> = new EventEmitter<UpdateBeatType>();
	@Output() focusElementInBeatsFlow: EventEmitter<any> = new EventEmitter<any>();
	@Output() addBeatByButton: EventEmitter<void> = new EventEmitter<void>();
	@Output() removeBeatByButton: EventEmitter<string> = new EventEmitter<string>();

	isDataLoaded: boolean = false;
	plotPoints: any[];

	private initialBeatType: number;

	private plotPointContainerSize: number;
	private defaultBeatMarginBottom: number;
	private plotPointRadius: number;
	private initialGraphTopMargin: number;
	plotFlowWidth: number;

	private moveImage = new Image();
	private swapImage = new Image();

	
	graphHeigth: string;
	startCoord: string;
	endCoord: string;
	baseCoord: string;
	plusButtonShift: string;

	private beatToSwapBase: BeatToSwapDto = null;
	private beatToSwapTarget: BeatToSwapDto = null;
	private beatsToMoveDto: BeatToMoveDto = null;
	private swapBeatsInsteadOfMove: boolean = false;

	private resizeObserver: ResizeObserver 

	private isBeatTypeTooltipShown: boolean = false;
	private elementToFocusAfterClose: any = null;
	private currentBeatIdToChangeBeatType: string;
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
		this.setupEditorCallback();
		this.setupSubscription();

		this.resizeObserver = new ResizeObserver((entries) => { 
			if (this.isBeatTypeTooltipShown == true) {
				this.hideBeatTypeTooltip()
			}
		});

		this.resizeObserver.observe(this.host.nativeElement);
		this.moveImage.src = '/assets/move.png';
		this.swapImage.src = '/assets/swap.png';
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
		this.cdRef.detectChanges();
		this.subscribeToBeatTypeTooltipKeyboardEvents();

		this.nnaTooltipService.addTooltip(
			this.nnaTooltipService.beatTypeTooltipName,
			beatIconElement,
			this.beatTypeTooltipElement.nativeElement,
			{ 
				arrowNativeElenemt: this.tooltipArrowElement.nativeElement,
				placement: 'right',
				offset: { mainAxis: 10 } as TooltipOffsetOptions
			}
		);
		
		this.nnaTooltipService.showTooltip(this.nnaTooltipService.beatTypeTooltipName);
		this.isBeatTypeTooltipShown = true;
		this.cdRef.detectChanges();
	}

	hideBeatTypeTooltip() {
		this.currentBeatIdToChangeBeatType = '';
		this.nnaTooltipService.hideTooltip(this.nnaTooltipService.beatTypeTooltipName);
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
	
	private handleBeatTypeChangeByKeyboard($event: any): void {
		if (!this.nnaTooltipService.isTooltipOpened(this.nnaTooltipService.beatTypeTooltipName)) {
			this.unsubscribeFromBeatTypeTooltipKeyboardEvents();
			return;
		}
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


	// #endregion


	//#region beatsReordering
	  
	onBeatDragBeggin($event: any): void {
		$event.dataTransfer.clearData();
		this.beatToSwapBase = new BeatToSwapDto($event.target.dataset.id, +$event.target.dataset.order);
		this.beatToSwapTarget = null;
		this.plotPointsSvgElements.forEach(pp => pp.nativeElement.classList.add('ignore-events'));
		$event.dataTransfer.dropEffect = "move";

		if ($event.ctrlKey) {
			this.swapBeatsInsteadOfMove = true;
			this.plotPointsContainerElement.nativeElement.classList.add('dragging-swap');
			$event.dataTransfer.setData("application/beat-id-to-swap", $event.target.dataset.id);
			$event.dataTransfer.setData("application/beat-order-to-swap", $event.target.dataset.order);
			$event.dataTransfer.setDragImage(this.swapImage, 0, 21);
		} else {
			this.swapBeatsInsteadOfMove = false;
			this.plotPointsContainerElement.nativeElement.classList.add('dragging-move');
			$event.dataTransfer.setData("application/beat-id-to-move", $event.target.dataset.id);
			$event.dataTransfer.setData("application/beat-order-to-move", $event.target.dataset.order);  
			$event.dataTransfer.setDragImage(this.moveImage, 0, 21);
		}
	}

	onBeatDragOver($event: any): void {
		$event.preventDefault();
		$event.dataTransfer.dropEffect = "move";
	}

	onBeatDragHoverBeggin($event: any): void {
		$event.preventDefault();
		$event.dataTransfer.dropEffect = "move";
		if ($event.ctrlKey) {
			this.swapBeatsInsteadOfMove = true;
			if (this.beatToSwapBase.id != $event.target.dataset.id) {
				$event.target.classList.add("droppable-swap");
			} else {
				$event.target.classList.add("dragabble-swap");
			}
		} else {
			this.swapBeatsInsteadOfMove = false;
			if (this.beatToSwapBase.id != $event.target.dataset.id) {
				$event.target.classList.add("droppable-move");
			} else {
				$event.target.classList.add("dragabble-move");
			}
			
		}
	}

	onBeatDragHoverEnd($event: any): void {
		if ($event.ctrlKey) {
			this.swapBeatsInsteadOfMove = true;
			$event.target.classList.remove("droppable-swap");
		} else {
			this.swapBeatsInsteadOfMove = false;
			$event.target.classList.remove("droppable-move");
		}
	}

	onBeatDrop($event: any): void {
		$event.preventDefault();
		if ($event.ctrlKey) {
			if ($event.dataTransfer.getData("application/beat-id-to-swap") == $event.target.dataset.id) {
				return;
			}
			this.swapBeatsInsteadOfMove = true;
			this.beatToSwapBase = new BeatToSwapDto($event.dataTransfer.getData("application/beat-id-to-swap"), +$event.dataTransfer.getData("application/beat-order-to-swap"));
			this.beatToSwapTarget = new BeatToSwapDto($event.target.dataset.id, +$event.target.dataset.order);
		} else {
			this.swapBeatsInsteadOfMove = false;
			this.beatsToMoveDto = new BeatToMoveDto($event.dataTransfer.getData("application/beat-id-to-move"), +$event.target.dataset.order, +$event.dataTransfer.getData("application/beat-order-to-move"));
		}
	}

	onDrugAndDropEnd($event: any): void {
		this.plotPointsSvgElements.forEach(plotPointSvgElement => plotPointSvgElement.nativeElement.classList.remove("ignore-events"));
		this.plotPointsElements.forEach(plotPointElement => {
			plotPointElement.nativeElement.classList.remove("droppable-swap");
			plotPointElement.nativeElement.classList.remove("dragabble-swap");
			plotPointElement.nativeElement.classList.remove("droppable-move");
			plotPointElement.nativeElement.classList.remove("dragabble-move");
		});
		this.plotPointsContainerElement.nativeElement.classList.remove("dragging-swap");
		this.plotPointsContainerElement.nativeElement.classList.remove("dragging-move");
		
		if ($event.dataTransfer.dropEffect == "move") {
			if (this.swapBeatsInsteadOfMove == true) {
				if (this.beatToSwapBase == null || this.beatToSwapTarget == null) {
					this.beatToSwapBase = null;
					this.beatToSwapTarget = null;
					this.swapBeatsInsteadOfMove = false;
					return;
				}
				this.reorderBeats.emit({operation: 'swap', data: new BeatsToSwapDto(this.beatToSwapBase, this.beatToSwapTarget)});
				} else {
					if (this.beatsToMoveDto == null) {
						this.swapBeatsInsteadOfMove = false;
						return;
					}
					this.swapBeatsInsteadOfMove = false;
					this.reorderBeats.emit({operation: 'move', data: this.beatsToMoveDto });
				}
		}

		this.swapBeatsInsteadOfMove = false;
		this.beatToSwapBase = null;
		this.beatToSwapTarget = null;
		this.beatsToMoveDto = null;
	}
	
	// #endregion


	// #region  general settings

	private setupSubscription(): void {
		this.updateGraph.subscribe(update => {
			if (update.newplotPoints) {
				this.plotPoints = [ ...update.newplotPoints]
			}
			if (update.isFinished !== undefined) {
				this.isDmoFinished = update.isFinished;
			}
			this.graphHeigth = this.editorSharedService.calculateGraphHeigth(this.plotPoints, this.isDmoFinished);
			this.cdRef.detectChanges();

			this.renderGraph();
			this.setupEditorCallback();
		});

		this.openBeatTypeTooltip.subscribe($event => {
			this.showBeatTypeTooltip(this.selectPlotPointSvgIconFromBeatId($event.beatId), $event.beatId, $event.beatType, $event.elementToFocusAfterClose);
		});
	}

	onAddBeatByButton(): void {
		this.addBeatByButton.emit();
	}

	onRemoveBeatByButton(beatId: string): void {
		this.removeBeatByButton.emit(beatId);
	}

	showRemoveBeatButton($event: any, i: number, fromSibling : boolean = false): void {
		if (i === 0) {
			return;
		}
		if (!fromSibling) {
			$event.target.firstChild?.classList.add('plot-point-controls-container-visible');
		} else {
			$event.target.parentNode?.firstChild?.classList.add('plot-point-controls-container-visible');
		}
	}

	hideRemoveBeatButton($event: any, i: number, fromSibling : boolean = false): void {
		if (i === 0) {
			return;
		}

		if (!fromSibling) {
			$event.target.firstChild?.classList.remove('plot-point-controls-container-visible');
		} else {
			$event.target.parentNode?.firstChild?.classList.remove('plot-point-controls-container-visible');
		}
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
		this.graphHeigth = this.editorSharedService.calculateGraphHeigth(this.plotPoints, this.isDmoFinished);
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
		this.plusButtonShift = `top: ${+this.graphHeigth + this.plotPointContainerSize - this.plotPointRadius + 2}px`;
	}

	private setupPlotPointsMargin(): void {
		this.plotPointsElements.forEach((plotPoint, i) => {
			let nativeElement = plotPoint.nativeElement.firstChild;
			if (this.plotPoints.find(p => p.beatId === this.editorSharedService.selectBeatId(nativeElement))) {
				nativeElement.parentElement.setAttribute('style', `padding-bottom: ${this.calculatePlotPointMargin(i)}px`);
			}
		});
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
			if (beatId == this.editorSharedService.selectBeatId(plotPointSvg.nativeElement)) {
				selectedPlotPointSvg = plotPointSvg.nativeElement;
				return;
			}
		})  
		
		return this.selectBeatIconElement(selectedPlotPointSvg)
	}

  	// #endregion
}
