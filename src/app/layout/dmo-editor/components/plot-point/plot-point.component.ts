import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-plot-point',
  templateUrl: './plot-point.component.html',
  styleUrls: ['./plot-point.component.scss']
})
export class PlotPointComponent implements OnInit {

  private margin: string;
  @ViewChild('plotPointContainer', {static: true}) plotPointContainer: ElementRef;

  public shift: number;
  public radius : number;
  public plotPointContainerSize: number;

  constructor() { }
  
  ngOnInit(): void {
    if (!this.shift) {
      this.margin = 'margin-top: 0';
    } else {
      this.margin = `margin-top: ${this.shift}px`;
    }

    this.plotPointContainer.nativeElement.setAttribute('style', this.margin);
  }

}
