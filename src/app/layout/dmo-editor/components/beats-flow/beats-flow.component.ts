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

  // -------- time picker

  setupTimePickerValues(): void {
    this.timePickersElements.forEach((picker) => {
      let beat = this.beats.find(b => b.beatId == this.selectBeatId(picker));
      if (!beat) {
        return;
      }

      picker.nativeElement.value = this.getTimeView(beat.time, true);

      // console.log(beat);
      // console.log(picker.nativeElement);
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
  }

  setTimePickerValue(event: any): void {
    let key = event.which || event.keyCode || event.charCode;
    if ((key == 37 || key == 38 || key == 39 || key == 40)) {
      this.shiftCursorOnColon(event.target, key);
      return;
    }

    let timeDto = this.convertTimeToDto(event.target.value);
    event.target.value = this.getTimeView(timeDto, false);
    console.log(timeDto);
    // console.log(value);

  }

  finalizeTimePicker(event: any) {
    if (!event.target.value) {
      event.target.value = this.defaultTimePickerValue;
      return;
    }
    
    //picker.nativeElement.value = this.getTimeView(beat.time);

    // if (this.timeSet.minutes.hasValue) {
    //   if (this.timeSet.minutes.value.length == 1) {
    //     this.timeSet.minutes.setValue(`${this.timeSet.minutes.value}0`);
    //   }
    // }

    // if (this.timeSet.seconds.hasValue) {
    //   if (this.timeSet.seconds.value.length == 1) {
    //     this.timeSet.seconds.setValue(`${this.timeSet.seconds.value}0`);
    //   }
    // } 

    // this.setupAndSendValue();
  }

  private convertTimeToDto(value: string) {
    let time = value.replace(/:+/g, '');
    time = time.replace(/ +/g, '0');
    
    var timeDto = new NnaBeatTimeDto();
    timeDto.hours = -1;
    timeDto.minutes = -1;
    timeDto.seconds = -1;

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

  // --------

  // private selectBeatsIds() {
  //   let beatSufix = 'time_picker_';
  //   return this.timePickersElements.map(b => b.nativeElement.getAttribute('id').substring(beatSufix.length));
  // }


}
