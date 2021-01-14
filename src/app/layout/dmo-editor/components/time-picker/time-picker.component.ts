import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TimeDto, PlotPointDto, TimeValueDto } from '../../models/editorDtos';

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss']
})
export class TimePickerComponent implements OnInit {

  @Input() plotPoint: PlotPointDto;
  @Output() timeSetEvent = new EventEmitter<PlotPointDto>();
  @ViewChild('timePicker', { static: true }) timePicker: ElementRef;

  private timeSet: TimeDto; //main field with data
  private changesDetected: boolean;
  private isKeyEventValid: boolean;
  private isRemoveKeyPressed: boolean;
  private isArrowKeyPressed: boolean;
  private pressedKeyCode: number;
  private isEnterKeyPressed: boolean;
  private isFieldValid: boolean;

  constructor() { 
    this.timeSet = new TimeDto();
    this.isKeyEventValid = false;
    this.isRemoveKeyPressed = false;
    this.changesDetected = true;
    this.isFieldValid = true;
  }

  ngOnInit() {
    if (this.plotPoint) {
      this.changesDetected = true;
      this.setTime(this.plotPoint.time, false);
      this.isFieldValid = this.plotPoint.time.isValid;
    }
  }

  pick(value: string): void {
    if (!this.isKeyEventValid) {
      return;
    }

    if (this.isArrowKeyPressed) {
      this.shiftCursor();
      return;
    }

    let timeDto = this.parseInputTime(value);

    if (this.isEnterKeyPressed) {
      this.setTime(timeDto, false)
      this.timePicker.nativeElement.blur();
    } else {
      this.setTime(timeDto);
    }
  }

  setKeyMetaData(event: any): void {
    let key = event.which || event.keyCode || event.charCode;
    if ((key < 48 || key > 57) &&  // numbers
        (key < 97 || key > 107) && // numbers on numeric keyboard
        key != 8 && key != 46 &&   // delete and backspace
        key != 37 && key != 39 &&  // left and right arrows
        key != 13 &&               // enter
        key != 32) {               // space
      event.preventDefault();
      this.isKeyEventValid = false;
      this.isRemoveKeyPressed = false;
      this.changesDetected = false;
      return;
    }

    this.pressedKeyCode = key;
    if (key == 8 || key == 46 ) {
      this.isRemoveKeyPressed = true;
    } else {
      this.isRemoveKeyPressed = false;
    }
    
    if (key == 37 || key == 39) {
      this.isArrowKeyPressed = true;
      this.changesDetected = false;
    } else {
      this.changesDetected = true;
      this.isArrowKeyPressed = false;
    }

    if (key == 13) {
      this.isEnterKeyPressed = true;
    } else {
      this.isEnterKeyPressed = false;
    }

    if (this.isRemoveKeyPressed) {
      this.shiftCursor();
    }

    this.isKeyEventValid = true;
  }
    
  finalize(): void {
    if (!this.timeSet || this.timeSet.isEmpty) {
      this.timeSet = new TimeDto().getDefaultDto();
      this.setupAndSendValue();
      return;
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

    this.setupAndSendValue();
  }



  

  private setupAndSendValue() {
    this.changesDetected = true;
    this.setTime(this.timeSet, false);
    this.isFieldValid = this.timeSet.isValid;

    let plotPoint: PlotPointDto = {
      id: this.plotPoint.id,
      order: this.plotPoint.order, // todo: in case if I add draggability to the plot flow
      lineCount: this.plotPoint.lineCount, 
      time: this.timeSet
    }

    this.timeSetEvent.emit(plotPoint);
  }

  private shiftCursor(): void {
    let start = this.timePicker.nativeElement.selectionStart;
    if (this.pressedKeyCode == 37 || this.pressedKeyCode == 8 ) { // left or backspace
      if (start == 5 || start == 2) {
        this.timePicker.nativeElement.setSelectionRange(start - 1, start - 1);
      }
    } else if (this.pressedKeyCode == 39 || this.pressedKeyCode == 46 ) { // right or delete
      if (start == 1 || start == 4) {
        this.timePicker.nativeElement.setSelectionRange(start + 1, start + 1);
      }
    }
  }

  private setTime(timeDto: TimeDto, editMode: boolean = true): void {
    if(!this.changesDetected) {
      return;
    }

    this.timeSet = timeDto;
    this.timePicker.nativeElement.value = this.getTimeView(this.timeSet, editMode);
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
