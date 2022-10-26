import { ElementRef, Injectable } from '@angular/core';
import { arrow, computePosition, shift } from '@floating-ui/dom';

export interface NnaTooltipOptions {
	arrowElenemt: ElementRef;
	placement: string;
	shift?: number;
}

@Injectable({
  	providedIn: 'root'
})
export class NnaTooltipService {

	private tooltips: any[] = [];

  	constructor() { }

	addTooltip(name: string, hostingElement: ElementRef, tooltipElement: ElementRef, options: NnaTooltipOptions): void {
		if (this.tooltips.find(t => t.name == name) != undefined) {
			return;
		}
		this.tooltips.push({
			name: name,
			hostingElement,
			tooltipElement,
			options
		})
	}

	showTooltip(name: string): void {
		const tooltipObj = this.tooltips.find(t => t.name == name);
		if (tooltipObj == undefined) {
			return;
		}

		computePosition(tooltipObj.hostingElement.nativeElement, tooltipObj.tooltipElement.nativeElement, {
			placement: tooltipObj.options.placement,
			middleware: [shift({padding: tooltipObj.options.shift}), arrow({element: tooltipObj.options.arrowElenemt.nativeElement, padding: tooltipObj.options.shift*2}) ]
		  }).then((callback) =>  this.applyTooltopStylesStyles(
			callback.x, 
			callback.y, 
			callback.strategy, 
			callback.middlewareData,
			tooltipObj.tooltipElement,
			tooltipObj.options
			));

			tooltipObj.tooltipElement.nativeElement.style.display = 'block';
	}

	hideTooltip(name: string): void {
		const tooltipObj = this.tooltips.find(t => t.name == name);
		if (tooltipObj == undefined) {
			return;
		}	
		tooltipObj.tooltipElement.nativeElement.style.display = 'none';
	}


	applyTooltopStylesStyles(x = 0, y = 0, strategy = 'absolute', middlewareData: any = {}, tooltipElement: ElementRef, tooltipOptions: NnaTooltipOptions) {
		Object.assign(tooltipElement.nativeElement.style, {
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

		Object.assign(tooltipOptions.arrowElenemt.nativeElement.style, {
			top: middlewareData.arrow.y != null ? `${middlewareData.arrow.y}px` : '',
			left: middlewareData.arrow.x != null ? `${middlewareData.arrow.x}px` : '',
			[staticSide]: `-${tooltipOptions.shift}px`
		});
	}
}
