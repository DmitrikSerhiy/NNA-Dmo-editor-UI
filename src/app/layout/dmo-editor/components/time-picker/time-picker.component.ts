import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TimeDto } from '../../models/editorDtor';

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss']
})
export class TimePickerComponent implements OnInit {

  @ViewChild('timePicker', { static: true }) timePicker: ElementRef;
  private timeSet: TimeDto;
  private isKeyEventValid: boolean;

  constructor() { 
    this.timeSet = new TimeDto();
    this.isKeyEventValid = false;
  }

  ngOnInit() {
  }

  finalizeTimeInput(): void {
    //if (this.timeSet)
    // add validation?
  }

  validateKey(event: any): void {
    let key = event.which || event.keyCode || event.charCode;
    if ((key < 48 || key > 57) && key != 8 && key != 46 && key != 37 && key != 39) {
      event.preventDefault();
      this.isKeyEventValid = false;
      return;
    }

    this.isKeyEventValid = true;
  }

  timePick(value: string): void {
    if (!this.isKeyEventValid) {
      return;
    }

    let timeDto = this.parseInputTime(value);
    if (!timeDto) {
      this.timeSet = null;
      return;
    }

    this.timePicker.nativeElement.value = this.getTimeView(timeDto);
    this.timeSet = timeDto;
  }

  
  private getTimeView(time: TimeDto) : string {
    if (!time) {
      return null;
    }

    if (time.seconds) {
      return `${time.hour}:${time.minutes}:${time.seconds}`;
    }

    else if (time.minutes) {
      return `${time.hour}:${time.minutes}`;
    }

    return `${time.hour}`;
}

  private parseInputTime(timeInput: string): TimeDto {
    if (!timeInput || timeInput.length <= 0) {
      return null;
    } 
    let time = timeInput.replace(':', '').replace(':', '');
    let timeDto = new TimeDto();

    if (time.length == 1) {
      timeDto.hour = time;
      return timeDto;
    }

    else if (time.length > 1 && time.length <= 3) {
      timeDto.hour = time[0];
      if(time.length == 2) {
        timeDto.minutes = time[1];
      } else {
        timeDto.minutes = `${time[1]}${time[2]}`;
      }
      return timeDto;
    }

    timeDto.hour = time[0];
    timeDto.minutes = `${time[1]}${time[2]}`;
    if (time.length == 4) {
      timeDto.seconds = time[3];
    } else {
      timeDto.seconds = `${time[3]}${time[4]}`;
    }
    return timeDto;
  }
}
