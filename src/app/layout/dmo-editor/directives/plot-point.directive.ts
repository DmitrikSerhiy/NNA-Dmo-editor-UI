import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appPlotPoint]'
})
export class PlotPointDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
