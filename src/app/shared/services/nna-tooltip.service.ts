import { Injectable } from '@angular/core';
import { arrow, computePosition, offset, shift } from '@floating-ui/dom';

export interface TooltipOffsetOptions {
	mainAxis: number;
	crossAxis: number;
}

export interface NnaTooltipOptions {
	arrowNativeElenemt: any;
	placement: string;
	shift?: number;
	offset?: TooltipOffsetOptions;
}

@Injectable({
  	providedIn: 'root'
})
export class NnaTooltipService {

	private tooltips: any[] = [];

  	constructor() { }

	addTooltip(name: string, hostingNativeElement: any, tooltipNativeElement: any, options: NnaTooltipOptions): void {
		if (this.tooltips.find(t => t.name == name) != undefined) {
			this.removeTooltip(name);
		}

		options = this.setOptions(options);
		this.tooltips.push({
			name: name,
			hostingElement: hostingNativeElement,
			tooltipElement: tooltipNativeElement,
			options
		});
	}

	removeTooltip(name: string) {
		const tooltipToDeleteIndex = this.tooltips.findIndex(t => t.name == name);
		if (tooltipToDeleteIndex == -1) {
			return;
		}

		this.tooltips.splice(tooltipToDeleteIndex, 1);
	}

	showTooltip(name: string): void {
		const tooltipObj = this.tooltips.find(t => t.name == name);
		if (tooltipObj == undefined) {
			return;
		}

		computePosition(tooltipObj.hostingElement, tooltipObj.tooltipElement, {
			placement: tooltipObj.options.placement,
			middleware: [offset(tooltipObj.options.offset), shift({padding: tooltipObj.options.shift}), arrow({element: tooltipObj.options.arrowNativeElenemt }) ]
		  }).then((callback) =>  this.applyTooltopStylesStyles(
			callback.x, 
			callback.y, 
			callback.strategy, 
			callback.middlewareData,
			tooltipObj.tooltipElement,
			tooltipObj.options
			));

			tooltipObj.tooltipElement.style.display = 'block';
	}

	hideTooltip(name: string): void {
		const tooltipObj = this.tooltips.find(t => t.name == name);
		if (tooltipObj == undefined) {
			return;
		}	
		tooltipObj.tooltipElement.style.display = 'none';
	}


	private applyTooltopStylesStyles(x = 0, y = 0, strategy = 'absolute', middlewareData: any = {}, tooltipNativeElement: any, tooltipOptions: NnaTooltipOptions) {
		Object.assign(tooltipNativeElement.style, {
			position: strategy,
			left: `${x}px`,
			top: `${y}px`
		});

		if (middlewareData == null || middlewareData.arrow == null) {
			return;
		}

		const staticSide = {
			top: 'bottom',
			right: 'left',
			bottom: 'top',
			left: 'right',
		}[tooltipOptions.placement.split('-')[0]];

		Object.assign(tooltipOptions.arrowNativeElenemt.style, {
			top: middlewareData.arrow.y != null ? `${middlewareData.arrow.y}px` : '',
			left: middlewareData.arrow.x != null ? `${this.getHorizontalArrowOffset(middlewareData.arrow, staticSide, tooltipOptions.offset.crossAxis)}px` : '',
			[staticSide]: `-${tooltipOptions.shift}px`
		});
	}

	private getHorizontalArrowOffset(arrowData: any, placement: string, crossAxisOffset?: number): number {
		if (placement == 'left' || placement == 'right') {
			return arrowData.x;
		}
		let initialPosition =  arrowData.x;

		if (crossAxisOffset == 0 && arrowData.centerOffset == 0) {
			return initialPosition;
		}

		if (arrowData.centerOffset > 0) {
			initialPosition = initialPosition - arrowData.centerOffset
		} else if (arrowData.centerOffset < 0) {
			initialPosition = initialPosition + arrowData.centerOffset
		}

		if (crossAxisOffset > 0) {
			initialPosition = initialPosition + crossAxisOffset
		} else if (crossAxisOffset < 0) {
			initialPosition = initialPosition + crossAxisOffset + arrowData.centerOffset*2;
		}

		return initialPosition;
	}

	private setOptions(options: NnaTooltipOptions): NnaTooltipOptions {
		let validOptions: NnaTooltipOptions;
		if (options.shift === undefined) {
			options.shift = 5;
		}
		if (options.offset === undefined) {
			options.offset = { mainAxis: 5, crossAxis: 0 } as TooltipOffsetOptions ;
		}
		if (!options.placement) {
			options.placement = 'top';
		}
		validOptions = options;
		return validOptions;
	}
}
