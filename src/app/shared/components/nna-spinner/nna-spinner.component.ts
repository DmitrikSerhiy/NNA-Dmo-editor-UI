import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nna-spinner',
  templateUrl: './nna-spinner.component.html',
  styleUrls: ['./nna-spinner.component.scss']
})
export class NnaSpinnerComponent implements OnInit {
  visible: boolean = true;
  isInitial: boolean = true;
  constructor() { }

  async ngOnInit() {
    do {
      await this.sleep(800);
      this.toggle();
    } while(true)
  }

  private toggle(): void {
    this.visible = !this.visible;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
