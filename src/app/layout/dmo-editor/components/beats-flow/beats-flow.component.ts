import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { NnaBeatDto, NnaBeatTimeDto, NnaDmoDto } from '../../models/dmo-dtos';

@Component({
  selector: 'app-beats-flow',
  templateUrl: './beats-flow.component.html',
  styleUrls: ['./beats-flow.component.scss']
})
export class BeatsFlowComponent implements AfterViewInit  {

  @Input() initialBeats: any[];
  @Input() isDmoFinished: boolean;
  @Input() updateBeatsEvent: EventEmitter<any>;
  @Output() beatsSet: EventEmitter<any>;
  @Output() lineCountChanged: EventEmitter<any>;
  @Output() addBeat: EventEmitter<any>;

  isDataLoaded: boolean;
  beats: any[];

  private beatsIds: string[];
  private beatsMetaData: any[];
  private defaultTimePickerValue = '0:00:00';
  private beatLineHeigth: number
  private beatContrainerMinHeight: number;
  private onDownLines: any;
  private onUpLines: any;

  @ViewChildren('timePickers') timePickersElements: QueryList<ElementRef>;
  @ViewChildren('beatDataHolders') beatDataHolderElements: QueryList<ElementRef>;

  constructor(private cdRef: ChangeDetectorRef) {
    this.isDataLoaded = false;
    this.beatsSet = new EventEmitter<any>();
    this.lineCountChanged = new EventEmitter<any>();
    this.addBeat = new EventEmitter<any>();
    this.beatLineHeigth = 16;
    this.beatContrainerMinHeight = 32;
    this.onDownLines = [];
    this.onUpLines = [];
    this.beatsMetaData = [];
    this.beatsIds = [];
   }


  ngAfterViewInit(): void {
    this.beats = [ ...this.initialBeats];

    this.isDataLoaded = true;


    this.setupBeats();
    this.setupEditorCallback();

    this.setupSubscription();
  }

  private setupSubscription() {
    this.updateBeatsEvent.subscribe(update => {
      this.beats = [...update.beats]
      this.isDmoFinished = update.isFinished;

      this.setupBeats();
      this.setupEditorCallback();
    });
  }

  private setupBeats() {
    this.cdRef.detectChanges();
    this.setupTimePickerValues();
    this.setupBeatDataHolderValuesAndMetaData();
    this.setupLastBeatMargin();
    this.cdRef.detectChanges();
  }

  private setupEditorCallback() {
    this.beatsSet.emit({
      timePickers: this.timePickersElements, 
      beats: this.beatDataHolderElements, 
      beatMetadata: this.beatsMetaData,
      beatsIds: this.beatsIds
    });
  }

  // -------- [start] beat data holders

  beatContainerClick($event: any): void {
    if ($event.target.className == 'beat-data-holder-container') {
      $event.target.children[0].focus();
      this.shiftCursorToTheEndBeatText($event.target);
    }
  }

  setBeatKeyMetaData($event: any): void {
    let key = $event.which || $event.keyCode || $event.charCode;
    if (key == 13) { // enter
      $event.preventDefault();
      this.addBeat.emit({ beatIdFrom: this.selectBeatIdFromBeatDataHolder($event.target) });
      return;
    }

    this.onDownLines = this.calculateLineCount($event.target);

  }

  setBeatValue($event: any): void {
    let key = $event.which || $event.keyCode || $event.charCode;
    if (key == 13) { // enter
      $event.preventDefault();
      return;
    }

    this.onUpLines = this.calculateLineCount($event.target);

    this.checkLineCounts($event.target);
  }

  finalizeBeat($event: any): void {

  }

  private checkLineCounts(element: any) {
    let lastUp = this.onUpLines;
    let lastDown = this.onDownLines;

    if (lastDown.lines < lastUp.lines ) {
        this.lineCountChanged.emit({beatId: this.selectBeatIdFromBeatDataHolder(element), newLineCount: lastUp});
    } else if (lastDown.lines > lastUp.lines) {
        this.lineCountChanged.emit({beatId: this.selectBeatIdFromBeatDataHolder(element), newLineCount: lastUp});
    }
  }

  private setupLastBeatMargin() {
    this.beatDataHolderElements.last.nativeElement.parentNode.style.marginBottom = '0px';
  }

  private setupBeatMargin($event: any, calculatedLines: any): void {
    if (calculatedLines.lines % 2 != 0) {
      if ($event.target.parentNode.style.marginBottom == '0px' && calculatedLines.lines != 1) {
        let margin = (this.beatContrainerMinHeight * calculatedLines.newLineCount) - (calculatedLines.lines * this.beatLineHeigth);
        $event.target.parentNode.style.marginBottom = `${margin}px`;
      }
    } else {
      $event.target.parentNode.style.marginBottom = '0px';
    }
  }

  private calculateLineCount(nativeElement: any): any {
    let spanHeight = nativeElement.offsetHeight;
    let lines = Math.ceil(spanHeight / this.beatLineHeigth);

    return lines <= 1
      ? { lineCount: 1, lines: lines }
      : { lineCount: lines % 2 == 0 ? (lines / 2) : Math.floor(lines / 2) + 1, lines: lines};
  }

  private setupBeatDataHolderValuesAndMetaData(): void {
    this.beatsMetaData = [];
    this.beatsIds = [];

    this.beatDataHolderElements.forEach((beatDataHolder) => {
      let beat = this.beats.find(b => b.beatId == this.selectBeatIdFromBeatDataHolder(beatDataHolder.nativeElement));
      if (!beat) {
        return;
      }

      beatDataHolder.nativeElement.innerHTML = beat.text;
      this.beatsMetaData.push(this.calculateLineCount(beatDataHolder.nativeElement));
      this.beatsIds.push(beat.beatId);
    });
  }

  private selectBeatIdFromBeatDataHolder(beatHolder: any): string {
    let beatSufix = 'beat_';
    return beatHolder.getAttribute('id').substring(beatSufix.length);
  }

  private shiftCursorToTheEndBeatText(element: any) {
    var range = document.createRange();
    var sel = window.getSelection();
    
    if (!element.children) {
      return;
    }
    if (element.children[0].innerText.length > 0) {
      range.setStart(element.children[0], 1);
    } else { 
      range.setStart(element.children[0], 0);
    }
    range.collapse(true)

    sel.removeAllRanges();
    sel.addRange(range);
  }

  // -------- [end] beat data holders

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
      let beat = this.beats.find((b: NnaBeatDto)=> b.beatId == this.selectBeatIdFromTimePicker(picker));
      if (!beat) {
        return;
      }

      picker.nativeElement.value = this.adjastSingleMinutesAndSeconds(this.getTimeView(beat.time, true));;
    });
  }

  private adjustInvalidMinutesAndSeconds(time: NnaBeatTimeDto): NnaBeatTimeDto {
    if (time.hours != null) {
      if (time.hours < 0) {
        time.hours = 0;
      } else if (time.hours > 9) {
        time.hours = 9;
      }
    }

    if (time.minutes != null) {
      if (time.minutes < 0) {
        time.minutes = 0;
      } else if (time.minutes > 60) {
        time.minutes = 60;
      }
    }

    if (time.seconds != null) {
      if (time.seconds < 0) {
        time.seconds = 0;
      } else if (time.seconds > 60) {
        time.seconds = 60;
      }
    }
    return time;
  }

  private getTimeView(time: NnaBeatTimeDto, adjast: boolean): string {
    if (time == null) {
      return this.defaultTimePickerValue;
    }

    if (time.hours == null && time.minutes == null && time.seconds == null) {
      return this.defaultTimePickerValue;
    }

    if (adjast) {
      time = this.adjustInvalidMinutesAndSeconds(time);
    }

    let timeString: string = '';
    if (time.hours == null) {
      timeString += '0:';
    } else {
      timeString += `${time.hours}:`;
    }

    if (time.minutes == null) {
      timeString += '00:';
    } else {
      timeString += `${time.minutes}:`;
    }

    if (time.seconds == null) {
      timeString += '00';
    } else {
      timeString += `${time.seconds}`;
    }

    return timeString;
  }

  private selectBeatIdFromTimePicker(picker: ElementRef): string {
    let beatSufix = 'time_picker_';
    return picker.nativeElement.getAttribute('id').substring(beatSufix.length);
  }

  private adjastSingleMinutesAndSeconds(time: string): string {
    let minutesAndSeconds = time.split(":").slice(-2);
    let timeString: string = `${time[0]}:`;
    
    if (minutesAndSeconds[0].length == 1) {
      timeString += `0${minutesAndSeconds[0]}:`;
    } else {
      timeString += `${minutesAndSeconds[0]}:`;
    }

    if (minutesAndSeconds[1].length == 1) {
      timeString += `0${minutesAndSeconds[1]}`;
    } else {
      timeString += `${minutesAndSeconds[1]}`;
    }

    return timeString;
  }

  private fillSingleMinutesAndSeconds(time: NnaBeatTimeDto): string {
    let timeString: string = `${time.hours}:`;
    if (time.minutes > 0 && time.minutes < 10) {
      timeString += `0${time.minutes}:`;
    } else {
      timeString += `${time.minutes}:`;
    } 

    if (time.seconds > 0 && time.seconds < 10) {
      timeString += `0${time.seconds}`;
    } else {
      timeString += `${time.seconds}`;
    } 
    return timeString;
  }

  private fillEmtpyTimeDto(value: string): string {
    let time = value.replace(/:+/g, '');
    time = time.replace(/ +/g, '0');

    switch (time.length) {
      case 1: return `${time}:00:00`;
      case 2: return `${time[0]}:0${time[1]}:00`;
      case 3: return `${time[0]}:${time[1]}${time[2]}:00`;
      case 4: return `${time[0]}:${time[1]}${time[2]}:0${time[3]}`;
      case 5: return `${time[0]}:${time[1]}${time[2]}:${time[3]}${time[4]}`;
      default: return this.defaultTimePickerValue;
    }
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
