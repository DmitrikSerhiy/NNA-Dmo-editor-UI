import { ElementRef, Injectable } from '@angular/core';
import { arrow, computePosition, offset, shift } from '@floating-ui/dom';

export interface NnaTooltipOptions {
	arrowNativeElenemt: any;
	placement: string;
	shift?: number;
	offset?: number;
}

@Injectable({
  	providedIn: 'root'
})
export class NnaTooltipService {

	private tooltips: any[] = [];

  	constructor() { }

	addTooltip(name: string, hostingNativeElement: any, tooltipNativeElement: any, options: NnaTooltipOptions): void {
		if (this.tooltips.find(t => t.name == name) != undefined) {
			return;
		}

		if (options.shift === undefined) {
			options.shift = 5;
		}
		if (options.offset === undefined) {
			options.offset = 5;
		}
		if (!options.placement) {
			options.placement = 'top';
		}
		this.tooltips.push({
			name: name,
			hostingElement: hostingNativeElement,
			tooltipElement: tooltipNativeElement,
			options
		})
	}

	removeTooltip(name: string) {
		const tooltipToDeleteIndex = this.tooltips.indexOf(t => t.name == name);
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


	applyTooltopStylesStyles(x = 0, y = 0, strategy = 'absolute', middlewareData: any = {}, tooltipNativeElement: any, tooltipOptions: NnaTooltipOptions) {
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
			left: middlewareData.arrow.x != null ? `${middlewareData.arrow.x}px` : '',
			[staticSide]: `-${tooltipOptions.shift}px`
		});
	}
}
