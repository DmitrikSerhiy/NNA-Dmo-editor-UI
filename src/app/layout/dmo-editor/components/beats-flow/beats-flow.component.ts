import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, QueryList, ViewChildren } from '@angular/core';
import { NnaBeatTimeDto } from '../../models/dmo-dtos';

@Component({
  selector: 'app-beats-flow',
  templateUrl: './beats-flow.component.html',
  styleUrls: ['./beats-flow.component.scss']
})
export class BeatsFlowComponent implements AfterViewInit  {

  @Input() initialBeats: any[];

  isDataLoaded: boolean;
  beats: any[];

  private defaultTimePickerValue = '0:00:00';

  @ViewChildren('timePickers') timePickersElements: QueryList<ElementRef>;

  constructor(private cdRef: ChangeDetectorRef) {
    this.isDataLoaded = false;
   }


  ngAfterViewInit(): void {
    this.beats = [ ...this.initialBeats];


    this.isDataLoaded = true;
    this.cdRef.detectChanges();

    this.setupTimePickerValues();
    this.cdRef.detectChanges();
  }




  // -------- [start] time picker

  setTimePickerKeyMetaData(event: any): void {
    let key = event.which || event.keyCode || event.charCode;
    if (((key < 48 || key > 59) &&  // numbers
        (key < 96 || key > 105)) && // numbers on numeric keyboard
        key != 8 && key != 46 &&    // delete and backspace
        key != 13 &&                // enter
        key != 32 &&                // space
        key != 9 &&                 // tab
        !(key == 37 || key == 38 || key == 39 || key == 40)) { // arrow keys
      event.preventDefault();
      return;
    }

    if (key == 8 || key == 46 ) {
      event.preventDefault();
      this.shiftCursorOnColon(event.target, key);
      return;
    }

    if (this.replaceNextSpaceWithCharacter(event.target, +event.key[0])) {
      event.preventDefault();
      return;
    }
  }

  setTimePickerValue(event: any): void {
    let key = event.which || event.keyCode || event.charCode;
    if (key == 8 || key == 46 ) {
      this.replaceRemovedCharacterWithSpace(event.target, key);
      return;
    }
  }

  finalizeTimePicker(event: any): void {
    if (!event.target.value) {
      event.target.value = this.defaultTimePickerValue;
      return;
    }
    
    event.target.value = this.fillEmtpyTimeDto(event.target.value)
  }

  private setupTimePickerValues(): void {
    this.timePickersElements.forEach((picker) => {
      let beat = this.beats.find(b => b.beatId == this.selectBeatId(picker));
      if (!beat) {
        return;
      }

      picker.nativeElement.value = this.getTimeView(beat.time, true);
    });
  }

  private adjustMinutesAndSeconds(time: NnaBeatTimeDto): NnaBeatTimeDto {
    if (time.hours < 0) {
      time.hours = 0;
    } else if (time.hours > 9) {
      time.hours = 9;
    }

    if (time.minutes < 0) {
      time.minutes = 0;
    } else if (time.minutes > 60) {
      time.minutes = 60;
    }

    if (time.seconds < 0) {
      time.seconds = 0;
    } else if (time.seconds > 60) {
      time.seconds = 60;
    }
    return time;
  }

  private getTimeView(time: NnaBeatTimeDto, adjast: boolean): string {
    if (!time) {
      return this.defaultTimePickerValue;
    }

    if (time.hours && !time.minutes && !time.seconds) {
      if (adjast) {
        time = this.adjustMinutesAndSeconds(time);
      }
      return `${time.hours}:00:00`;
    }
    if (time.hours && time.minutes && !time.seconds) {
      if (adjast) {
        time = this.adjustMinutesAndSeconds(time);
      }
      return `${time.hours}:${time.minutes}:00`;
    }

    if (adjast) {
      time = this.adjustMinutesAndSeconds(time);
    }
    return `${time.hours}:${time.minutes}:${time.seconds}`;
  }

  private selectBeatId(picker: ElementRef): string {
    let beatSufix = 'time_picker_';
    return picker.nativeElement.getAttribute('id').substring(beatSufix.length);
  }

  private fillEmtpyTimeDto(value: string): string {
    let time = value.replace(/:+/g, '');
    time = time.replace(/ +/g, '0');

    switch (time.length) {
      case 1: return `${time}:00:00`;
      case 2: return `${time[0]}:${time[1]}0:00`;
      case 3: return `${time[0]}:${time[1]}${time[2]}:00`;
      case 4: return `${time[0]}:${time[1]}${time[2]}:${time[3]}0`;
      case 5: return `${time[0]}:${time[1]}${time[2]}:${time[3]}${time[4]}`;
      default: return this.defaultTimePickerValue;
    }
  }

  private convertTimeToDto(value: string): NnaBeatTimeDto {
    let time = value.replace(/:+/g, '');
    time = time.replace(/ +/g, '0');
    
    var timeDto = new NnaBeatTimeDto();
    timeDto.hours = 0;
    timeDto.minutes = 0;
    timeDto.seconds = 0;

    if (time.length == 1) {
      timeDto.hours = +time[0];
      return timeDto;
    } else if (time.length > 1 && time.length <= 3) {
      timeDto.hours = +time[0];
      if (time.length == 2) {
        timeDto.minutes = +time[1];
      } else {
        timeDto.minutes = +`${time[1]}${time[2]}`;
      }
      return timeDto;
    }

    timeDto.hours = +time[0];
    timeDto.minutes = +`${time[1]}${time[2]}`;
    if (time.length == 4) {
      timeDto.seconds = +time[3];
    } else {
      timeDto.seconds = +`${time[3]}${time[4]}`;
    }
    return timeDto;
  }

  private replaceNextSpaceWithCharacter(nativeElement: any, value: number) : boolean {
    if (Number.isNaN(value)) {
      return false;
    }

    let start = nativeElement.selectionStart;
    let initialValue = nativeElement.value;
    if (start == initialValue.length) {
      return false;
    }

    if (start == 1 || start == 4) {
      start = start + 1;
    }

    if (initialValue[start] != " ") {
      return false;
    }

    nativeElement.value = this.replaceWith(initialValue, start, value.toString());
    nativeElement.setSelectionRange(start + 1, start + 1);
    return true;
  }

  private replaceRemovedCharacterWithSpace(nativeElement: any, key: number) {
    let start = nativeElement.selectionStart;
    let initialValue = nativeElement.value;
    if (key == 8) { //backspace
      if (start == 0) {
        return;
      }
      nativeElement.value = this.replaceWith(initialValue, start -1, " ");
      nativeElement.setSelectionRange(start - 1, start - 1);
    } else if (key == 46) { //delete
      if (start == 7) {
        return;
      }
      nativeElement.value = this.replaceWith(initialValue, start, " ");
      nativeElement.setSelectionRange(start, start);
    }
    
  }

  private replaceWith(value: string, index: number, replace: string) {
    return `${value.substr(0, index)}${replace}${value.substr(index + 1)}`;
  }

  private shiftCursorOnColon(nativeElement: any, key: number): void {
    let start = nativeElement.selectionStart;
    if (key == 37 || key == 8 ) { // left or backspace
      if (start == 5 || start == 2) {
        nativeElement.setSelectionRange(start - 1, start - 1);
      }
    } else if (key == 39 || key == 46 ) { // right or delete
      if (start == 1 || start == 4) {
        nativeElement.setSelectionRange(start + 1, start + 1);
      }
    }
  }

  // -------- [end]  time picker

}
