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
  private previousTimeSetObject: any;
  private changesDetected: boolean;
  private initialLoad: boolean;
  // private isTimeValid: boolean;
  private isKeyEventValid: boolean;
  private isRemoveKeyPressed: boolean;
  private isSpaceKeyPressed: boolean;

  constructor() { 
    this.timeSet = new TimeDto();
    this.isKeyEventValid = false;
    this.isRemoveKeyPressed = false;
    this.previousTimeSetObject = { previousTimeSet: new TimeDto(), previousTimeView: '' };
    this.initialLoad = true;
    this.changesDetected = true;
    this.isSpaceKeyPressed = false;
  }

  ngOnInit() {
  }

  finalizeTimeInput(): void {
    if (!this.timeSet || this.timeSet.isEmpty) {
      this.timeSet = new TimeDto().getDefaultDto();
      this.changesDetected = true;
      this.setTime(this.timeSet, false);
      return
    }

    if (this.timeSet.minutes.hasValue) {
      if (this.timeSet.minutes.value.length == 1) {
        this.timeSet.minutes.setValue(`${this.timeSet.minutes.value}0`);
      }
    }

    if (this.timeSet.seconds.hasValue) {
      if (this.timeSet.seconds.value.length == 1) {
        this.timeSet.seconds.setValue(`${this.timeSet.seconds.value}0`);
      }
    }

    this.changesDetected = true;
    this.setTime(this.timeSet, false);
  }

  setKeyMetaData(event: any): void {
    let key = event.which || event.keyCode || event.charCode;
    if ((key < 48 || key > 57) &&  // numbers
        (key < 97 || key > 107) && // numbers on numeric keyboard
        key != 8 && key != 46 &&   // delete and backspace
        key != 37 && key != 39 &&  // left and right arrows
        key != 32) {               // space
      event.preventDefault();
      this.isKeyEventValid = false;
      this.isRemoveKeyPressed = false;
      this.changesDetected = false;
      return;
    }

    if (key == 8 || key == 46 ) {
      this.isRemoveKeyPressed = true;
    } else {
      this.isRemoveKeyPressed = false;
    }
    
    if (key == 37 || key == 39) {
      this.changesDetected = false;
    } else {
      this.changesDetected = true;
    }

    if (key == 32) {
      this.isSpaceKeyPressed = true;
    } else {
      this.isSpaceKeyPressed = false;
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
    this.setTime(timeDto);
  }

  private setTime(timeDto: TimeDto, editMode: boolean = true) {
    if(!this.changesDetected) {
      return;
    }
    if(this.initialLoad) {
      this.previousTimeSetObject.previousTimeSet = timeDto;
      this.previousTimeSetObject.previousTimeView = this.getTimeView(timeDto, editMode);
      this.initialLoad = false;
    } else {
      this.previousTimeSetObject.previousTimeSet = this.timeSet;
      this.previousTimeSetObject.previousTimeView =  this.getTimeView(this.timeSet, editMode);
    }
    this.timeSet = timeDto;
    this.timePicker.nativeElement.value =  this.getTimeView(this.timeSet, editMode);

    console.log('prev');
    console.log( this.previousTimeSetObject.previousTimeSet);
    console.log(this.previousTimeSetObject.previousTimeView);

    console.log('curr');
    console.log(this.timeSet);
    console.log(this.timePicker.nativeElement.value);

  }
  
  private getTimeView(timeDto: TimeDto, editMode: boolean = true) : string {
    return editMode
      ? this.getTimeViewOnEditMode(timeDto)
      : this.getTimeViewOnDefaultMode(timeDto);
  }

  private getTimeViewOnDefaultMode(time: TimeDto) : string {
    if (time.isEmpty) {
      return `${time.hour.defaultValue}:${time.minutes.defaultValue}:${time.seconds.defaultValue}`;
    }

    if (time.hour.hasValue && !time.minutes.hasValue && !time.seconds.hasValue) {
      return `${time.hour.value}:${time.minutes.defaultValue}:${time.seconds.defaultValue}`;
    }

    if (time.hour.hasValue && time.minutes.hasValue && !time.seconds.hasValue) {
      return `${time.hour.value}:${time.minutes.value}:${time.seconds.defaultValue}`;
    }

    return `${time.hour.value}:${time.minutes.value}:${time.seconds.value}`;
  }

  private getTimeViewOnEditMode(time: TimeDto) : string {
    if (time.isEmpty) {
      return '';
    }

    if (time.hour.hasValue && !time.minutes.hasValue && !time.seconds.hasValue) {
      return time.hour.value;
    }

    if (time.hour.hasValue && time.minutes.hasValue && !time.seconds.hasValue) {
      return `${time.hour.value}:${time.minutes.value}`;
    }

    return `${time.hour.value}:${time.minutes.value}:${time.seconds.value}`;
  }

  private parseInputTime(timeInput: string): TimeDto {
    let timeDto = new TimeDto();
    if (!timeInput || timeInput.length <= 0) {
      return timeDto.getEmptyDto();
    } 
    
    let time = timeInput.replace(/:+/g, '');
    time = time.replace(/ +/g, '0');

    if (time.length == 1) {
      timeDto.setHour(time);
      return timeDto;
    }

    else if (time.length > 1 && time.length <= 3) {
      timeDto.setHour(time[0]);
      if(time.length == 2) {
        timeDto.setMinutes(time[1]);
      } else {
        timeDto.setMinutes(`${time[1]}${time[2]}`);
      }
      return timeDto;
    }

    timeDto.setHour(time[0]);
    timeDto.setMinutes(`${time[1]}${time[2]}`);
    if (time.length == 4) {
      timeDto.setSeconds(time[3]);
    } else {
      timeDto.setSeconds(`${time[3]}${time[4]}`);
    }
    return timeDto;
  }
}
