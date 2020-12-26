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
  private isTimeValid: boolean;
  private isKeyEventValid: boolean;
  private isRemoveKeyPressed: boolean;

  constructor() { 
    this.timeSet = new TimeDto();
    this.isKeyEventValid = false;
    this.isRemoveKeyPressed = false;
  }

  ngOnInit() {
  }

  finalizeTimeInput(): void {
    if (!this.timeSet) {
      this.timeSet = new TimeDto();
      this.timeSet.hour = '0';
      this.timeSet.minutes = '00';
      this.timeSet.seconds = '00';
      this.setTimeField();
      return
    }

    if (!this.timeSet.hour) {
      this.timeSet.hour = '0';
    }

    if (!this.timeSet.minutes) {
      this.timeSet.minutes = '00';
    } else if (this.timeSet.minutes.length == 1) {
      this.timeSet.minutes = `0${this.timeSet.minutes}`;
    }

    if (!this.timeSet.seconds) {
      this.timeSet.seconds = '00';
    } else if (this.timeSet.seconds.length == 1) {
      this.timeSet.seconds = `0${this.timeSet.seconds}`;
    }
    this.setTimeField();
  }

  validateKey(event: any): void {
    let key = event.which || event.keyCode || event.charCode;
    if ((key < 48 || key > 57) &&  // numbers
        (key < 97 || key > 107) && // numbers on numeric keyboard
        key != 8 && key != 46 &&   // delete and backspace
        key != 37 && key != 39 &&  // left and right arrows
        key != 32) {               // space
      event.preventDefault();
      this.isKeyEventValid = false;
      return;
    }

    if (key == 8 || key == 46 ) {
      this.isRemoveKeyPressed = true;
    } else {
      this.isRemoveKeyPressed = false;
    }
    this.isKeyEventValid = true;
  }

  timePick(value: string): void {
    if (!this.isKeyEventValid) {
      return;
    }

    // if(this.isSystmeKeyPressed) {
    //   console.log('system is pressed');
    //   return;
    // }

    let timeDto = this.parseInputTime(value);
    if (!timeDto) {
      this.timeSet = null;
      return;
    }

    this.timeSet = timeDto;
    this.setTimeField();
  }




  private setTimeField() {
    this.timePicker.nativeElement.value = this.getTimeView(this.timeSet);
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
    
    let time = timeInput.replace(/:+/g, '');
    time = time.replace(/ +/g, '0');
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
