import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { NnaBeatDto, NnaBeatTimeDto } from '../../models/dmo-dtos';

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
	@Output() removeBeat: EventEmitter<any>;
	@Output() syncBeats: EventEmitter<any>;

	isDataLoaded: boolean;
	beats: any[];

	private beatsIds: string[];
	private beatsMetaData: any[];
	private defaultTimePickerValue = '0:00:00';
	private defaultEmptyTimePickerValue = ' :  :  ';
	private beatLineHeigth: number
	private beatContrainerMinHeight: number;
	private onDownLines: any;
	private onUpLines: any;
	private valueBeforeRemove: string;
	private shiftIsPressed: boolean;
	private controlIsPressed: boolean;
	private tabIsPressed: boolean;


	@ViewChildren('timePickers') timePickersElements: QueryList<ElementRef>;
	@ViewChildren('beatDataHolders') beatDataHolderElements: QueryList<ElementRef>;

	constructor(private cdRef: ChangeDetectorRef) {
		this.isDataLoaded = false;
		this.shiftIsPressed = false;
		this.beatsSet = new EventEmitter<any>();
		this.lineCountChanged = new EventEmitter<any>();
		this.addBeat = new EventEmitter<any>();
		this.removeBeat = new EventEmitter<any>();
		this.syncBeats = new EventEmitter<any>();
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

		this.setupBeats(null, null, true);
		this.setupEditorCallback();
		this.setupSubscription();
	}


  	// #region general settings

	private setupSubscription() {
		this.updateBeatsEvent.subscribe(update => {
		this.beats = [...update.beats]
		this.isDmoFinished = update.isFinished;

		if (update.timePickerToFocus) {
			this.setupBeats(update.timePickerToFocus, null, false);
		} else if (update.beatIdToFocus) {
			this.setupBeats(null, update.beatIdToFocus, false);
		} else {
			this.setupBeats(null, null, false);
		}
	
		if (update.actionName != null) {
			this.setupEditorCallback(update.actionName);
		} else {
			this.setupEditorCallback();
		}
		
		});
	}

	private focusLastIfInitial() {
		let lastTimePickerElement = this.timePickersElements.last.nativeElement;
		let lastBeatElement = this.beatDataHolderElements.last.nativeElement;
		if (!lastBeatElement.innerHTML) {
			if (lastTimePickerElement.value == this.defaultTimePickerValue) {
				lastTimePickerElement.focus();
				lastTimePickerElement.setSelectionRange(0,0);
			} else {
				lastBeatElement.focus();
			}
		} else {
			this.shiftCursorToTheEndOfChildren(lastBeatElement.parentElement)
		}
	}

	private setupBeats(timePickerToFocus: string = null, beatIdToFocus: string = null, isInitial: boolean = false) {
		this.cdRef.detectChanges();
		this.setupTimePickerValues();
		this.setupBeatDataHolderValuesAndMetaData();
		this.setupLastBeatMargin();
		this.cdRef.detectChanges();

		if (timePickerToFocus != null) {
			this.beatsIds.forEach((beatId, i) => {
			if (beatId == timePickerToFocus) {
				let element = this.timePickersElements.toArray()[i].nativeElement;
				element.focus();
				element.setSelectionRange(0,0);
				return;
			}
		});
		} else if (beatIdToFocus != null) {
			this.beatsIds.forEach((beatId, i) => {
				if (beatId == beatIdToFocus) {
					this.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[i].nativeElement.parentElement);
					return;
				}
			});
		} else if (isInitial) {
			this.focusLastIfInitial();
		}
	}

	private setupEditorCallback(lastAction: string = null) {
		this.beatsSet.emit({
			timePickers: this.timePickersElements, 
			beats: this.beatDataHolderElements, 
			beatMetadata: this.beatsMetaData,
			beatsIds: this.beatsIds,
			lastAction: lastAction
		});
	}

  	// #endregion


	// #region key event handlers
	
	setTimePickerKeyMetaData(event: any): void {
		let key = event.which || event.keyCode || event.charCode;
		if (((key < 48 || key > 59) &&  // numbers
			(key < 96 || key > 105)) && // numbers on numeric keyboard
			key != 8 && key != 46 &&    // delete and backspace
			key != 13 &&                // enter
			key != 32 &&                // space
			key != 17 &&				// control
			key != 9 &&                 // tab
			!(key == 37 || key == 38 || key == 39 || key == 40)) { // arrow keys
			event.preventDefault();
			return;
		}

		if (key == 17) {
			this.controlIsPressed = true; // control
		}

		if (key == 13) { // enter
			this.focusSiblingBeat(event);
			event.preventDefault();
			return;
		}

		if (key == 9) {
			this.tabIsPressed = true;
			event.preventDefault();
		}

		if (key == 8 || key == 46 ) { // delete and backspace
			event.preventDefault();
			this.shiftCursorOnColon(event.target, key);
			return;
		}

		if (key == 39) { // right arrow
			if (event.target.selectionStart == 7 || this.tabIsPressed == true) {
				this.focusSiblingBeat(event);
				event.preventDefault();
				return;
			}
		}

		if (key == 37) { // left arrow
			if (event.target.selectionStart == 0 || this.tabIsPressed == true) {
				this.focusPreviousTimePicker(event);
			}
		}

		if (key == 40 || key == 38) { // up and down arrow
			this.focusPreviousNextTimePicker(event, key);
			event.preventDefault();
			return;
		}

		if (this.preventInvalidMinutesOrSeconds(event.target, +event.key[0])) {
			this.setValidMinutesOrSeconds(event.target);
			event.preventDefault();
			return;
		}

		if (this.replaceNextSpaceWithCharacter(event.target, +event.key[0])) {
			event.preventDefault();
			return;
		}
	}

	setTimePickerValue(event: any, index: number): void {
		let key = event.which || event.keyCode || event.charCode;

		if (key == 17) { // control
			this.controlIsPressed = false;
		}
		
		if (key == 9) { // tab
			this.tabIsPressed = false;
			event.preventDefault();
		}

		if (key == 13) { // enter
			event.preventDefault();
			return;
		}

		let beatWasRemoved: boolean;
		if (key == 8 || key == 46 ) { // backspace and delete
			if (event.target.value == this.defaultEmptyTimePickerValue) {
				const beatIdFromTimePicker = this.selectBeatIdFromTimePicker(event.target)
				this.beatDataHolderElements.forEach((beatDataHolder) => {
					if (this.selectBeatIdFromBeatDataHolder(beatDataHolder.nativeElement) == beatIdFromTimePicker) {
						const text = beatDataHolder.nativeElement.innerHTML;
						if (text.replace(/\s+/g, '').length == 0 && this.beatsIds.length != 1) {
							this.removeBeat.emit({beatIdToRemove: beatIdFromTimePicker});
							beatWasRemoved = true;
							return;
						}
					}
				});

			} else {
				this.replaceRemovedCharacterWithSpace(event.target, key);
			}
		}

		if (beatWasRemoved === true) {
			event.preventDefault();
			return;
		}

		if ((key >= 48 && key <= 59)  || // numbers
			(key >= 96 && key <= 105) || // numbers on numeric keyboard
			key == 32 ||                 // space
			(key == 8 || key == 46)) {   // backspace and delete
			this.beatsMetaData[index].isDirty = true;
		}
	}

	finalizeTimePicker(event: any): void {
		event.target.value = this.fillEmtpyTimeDto(event.target.value);
		if (event.relatedTarget == null) {
			this.syncBeats.emit('timePicker');
		} else {
			let beatId = this.selectBeatIdFromTimePicker(event.target);
			let timePickerId = this.selectBeatIdFromBeatDataHolder(event.relatedTarget);

			if (beatId != timePickerId) {
				this.syncBeats.emit('timePicker');
			}
		}
	}

	prepareTimePicker(event: any): void {
		if (event.target.value == this.defaultTimePickerValue) {
			event.target.value = this.defaultEmptyTimePickerValue;
			event.target.setSelectionRange(0, 0);
		} else {
			event.target.setSelectionRange(8, 8);
		}
	}

	beatContainerClick($event: any): void {
		if ($event.target.className == 'beat-data-holder-container') {
			$event.target.children[0].focus();
			this.shiftCursorToTheEndOfChildren($event.target);
		}
	}

	setBeatKeyMetaData($event: any): void {
		let key = $event.which || $event.keyCode || $event.charCode;

		if (key == 17) { // control
			this.controlIsPressed = true;
		}

		if (key == 16) { // shift
			this.shiftIsPressed = true;
		} 

		if (key == 9) { // tab
			this.tabIsPressed = true;
			$event.preventDefault();
		}

		if (key == 37 || key == 38 || key == 39 || key == 40) { // arrow keys
			this.focusNextPreviousBeat(key, $event);
			return;
		}

		if (key == 13) { // enter
			if (this.shiftIsPressed == false) {
				$event.preventDefault();
				this.addBeat.emit({ beatIdFrom: this.selectBeatIdFromBeatDataHolder($event.target) });
			} 
			return;
		}

		if (key == 8 || key == 46) { // delete or backspace
			this.valueBeforeRemove = $event.target.innerHTML;
		}

		this.onDownLines = this.calculateLineCount($event.target);
	}

	setBeatValue($event: any): void {
		let key = $event.which || $event.keyCode || $event.charCode;

		if (key == 17) { // control
			this.controlIsPressed = false;
		}

		if (key == 16) { // shift
			this.shiftIsPressed = false;
		}

		if (key == 9) { // tab
			this.tabIsPressed = false;
			$event.preventDefault();
		}

		if (key == 37 || key == 38 || key == 39 || key == 40) { // arrow keys
			return;
		}

		if (key == 13) { // enter
			if (!this.shiftIsPressed) {
				$event.preventDefault();
				return;
			}
		}

		if (key == 8 || key == 46) { // delete or backspace
			let text = $event.target.innerHTML;
			if (text.replace(/\s+/g, '').length == 0 && this.beatsIds.length != 1) {
				if (this.valueBeforeRemove == '') {
					this.removeBeat.emit({beatIdToRemove: this.selectBeatIdFromBeatDataHolder($event.target)});
					return;
				}
			}
		}

		this.onUpLines = this.calculateLineCount($event.target);

		this.checkLineCounts($event.target);
	}

	finalizeBeat($event: any): void {
		this.clearInnerTagsIfBeatIsEmpty($event);
		if ($event.relatedTarget == null) {
			this.syncBeats.emit('beat');
		} else {
			let timePickerId = this.selectBeatIdFromTimePicker($event.relatedTarget);
			let beatId = this.selectBeatIdFromBeatDataHolder($event.target);

			if (beatId != timePickerId) {
				this.syncBeats.emit('beat');
			}
		}
	}

	beatChanged($event: any, index: number): void {
		this.beatsMetaData[index].isDirty = true;
	}

	preventDrag(event: any) {
		event.preventDefault();
	}

	// #endregion


    // #region beat data holders (helpers)


	private clearInnerTagsIfBeatIsEmpty($event: any): void {
		console.log($event);
		console.log($event.target.childNodes);
		if (!$event.target.lastChild) {
			return;
		}

		if ($event.target.childNodes.length == 1) {
			if ($event.target.lastChild.nodeType == 3) {
				const pureText = $event.target.innerText.replace(/ +/g, '');
				if (pureText == '') {
					$event.target.innerText = '';
					return;
				}
			}
		}

		let childrenWithText = [...$event.target.childNodes].filter(child => child.nodeType == 3 && child.textContent.replace(/ +/g, '') != '');
		if (childrenWithText.length == 0) {
			$event.target.innerText = '';
		}
	}

	private focusNextPreviousBeat(key: number, $event: any): void {
		if (key == 38) { // up
			if (this.tabIsPressed) {
				this.beatsIds.forEach((beatId, i) => {
					if (beatId == this.selectBeatIdFromBeatDataHolder($event.target)) {
						if (i != 0) {
							$event.preventDefault();
							this.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[i - 1].nativeElement.parentElement);
							return;
						}
					}
				});
			}
			return;
		} else if (key == 40 || key == 39) { // down or right
			if (this.tabIsPressed) {
				this.beatsIds.forEach((beatId, i) => {
					if (beatId == this.selectBeatIdFromBeatDataHolder($event.target)) {
						if (i != this.beatsIds.length - 1) {
							$event.preventDefault();
							this.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[i + 1].nativeElement.parentElement);
							return;
						}
					}
				});
			}
			return;
		} else if (key == 37) { // left
			if (this.tabIsPressed || document.getSelection().focusOffset == 0) {
				this.beatsIds.forEach((beatId, i) => {
					if (beatId == this.selectBeatIdFromBeatDataHolder($event.target)) {
						let timePickerElement = this.timePickersElements.toArray()[i].nativeElement;
						timePickerElement.focus();
						if (timePickerElement.value == this.defaultEmptyTimePickerValue) {
							timePickerElement.setSelectionRange(0,0);
						} else {
							timePickerElement.setSelectionRange(8,8);
							setTimeout(() => {timePickerElement.setSelectionRange(8,8); }, 10);
						}
						return;
					}
				})
			}
		}
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
		let id = beatHolder.getAttribute('id');
		if (!id) {
			return null;
		}
		return id.substring(beatSufix.length);
	}

	private shiftCursorToTheEndOfChildren(dataHolderContainer: any) {
		if (!dataHolderContainer.children) {
			return;
		}

		let range = document.createRange();
		let dataHolder = dataHolderContainer.lastChild;

		if (!dataHolder.lastChild) {
			dataHolder.focus();
			return;
		} else {
			if (dataHolder.lastChild.nodeType == 3) { // TEXT_NODE
				range.setStart(dataHolder.lastChild, dataHolder.lastChild.textContent.length);
			} else { // any other element
				range.setStart(dataHolder.lastChild.lastChild, dataHolder.lastChild.lastChild.textContent.length);
			}

			range.collapse(true)
			let selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

    // #endregion


  	// #region time picker (helpers)

	private setupTimePickerValues(): void {
		this.timePickersElements.forEach((picker) => {
			let beat = this.beats.find((b: NnaBeatDto)=> b.beatId == this.selectBeatIdFromTimePicker(picker.nativeElement));
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

	private selectBeatIdFromTimePicker(nativeElement: any): string {
		let beatSufix = 'time_picker_';
		let id = nativeElement.getAttribute('id');
		if (!id) {
			return null;
		}
		return id.substring(beatSufix.length);
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

	private setValidMinutesOrSeconds(nativeElement: any) {
		const start = nativeElement.selectionStart;

		if (start == 2 || start == 5) {
			if (nativeElement.value[start] == ' ') {
				nativeElement.value = nativeElement.value.substring(0, start) + '6' + nativeElement.value.substring(start + 1);
				nativeElement.selectionStart = start + 1;
				nativeElement.selectionEnd = start + 1;
			}
		} else if (start == 1 || start == 4) {
			if (nativeElement.value[start+1] == ' ') {
				nativeElement.value = nativeElement.value.substring(0, start + 1) + '6' + nativeElement.value.substring(start + 2);
				nativeElement.selectionStart = start + 2;
				nativeElement.selectionEnd = start + 2;
			}
		} else if (start == 3) {
			nativeElement.value = nativeElement.value.substring(0, 3) + '0' + nativeElement.value.substring(3 + 1);
			nativeElement.selectionStart = start + 1;
			nativeElement.selectionEnd = start + 1;
		} else if (start == 6) {
			nativeElement.value = nativeElement.value.substring(0, 6) + '0' + nativeElement.value.substring(6 + 1);
			nativeElement.selectionStart = start + 1;
			nativeElement.selectionEnd = start + 1;
		}
	}

	private preventInvalidMinutesOrSeconds(nativeElement: any, value: number): boolean {
		if (Number.isNaN(value)) {
			return false;
		}

		const start = nativeElement.selectionStart;
		if (start == 2 || start == 5 || start == 1 || start == 4) {
			return value > 6;
		}

		if (start == 3) {
			return nativeElement.value[2] == '6';	
		}  
		
		if (start == 6) {
			return nativeElement.value[5] == '6';
		}
		
		return false;
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
		if (key == 8) { // backspace
			if (start == 0) {
				return;
			}
		nativeElement.value = this.replaceWith(initialValue, start -1, " ");
		nativeElement.setSelectionRange(start - 1, start - 1);
		} else if (key == 46) { // delete
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

	private focusSiblingBeat($event: any) {
		this.beatsIds.forEach((beatId, i) => {
			if (beatId == this.selectBeatIdFromTimePicker($event.target)) {
				this.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[i].nativeElement.parentElement);
				return;
			
			}
		});
	}

	private focusPreviousNextTimePicker($event, key) {
		if (key == 38) { // up
			this.focusPreviousTimePicker($event);
		} else if (key == 40) { // down
			this.focusNextTimePicker($event);
		}
	}

	private focusPreviousTimePicker($event) {
		this.beatsIds.forEach((beatId, i) => {
			if (beatId == this.selectBeatIdFromTimePicker($event.target)) {
				if (i != 0) {
					const timepickerElement = this.timePickersElements.toArray()[i - 1].nativeElement;
					timepickerElement.focus(); 
					return;
				}
			}
		});
	}

	private focusNextTimePicker($event) {
		this.beatsIds.forEach((beatId, i) => {
			if (beatId == this.selectBeatIdFromTimePicker($event.target)) {
				if (i != this.beatsIds.length - 1) {
					const timepickerElement = this.timePickersElements.toArray()[i + 1].nativeElement;
					timepickerElement.focus(); 
						timepickerElement.focus(); 
					timepickerElement.focus(); 

					return;
				}
			}
		});
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

  	// #endregion
}
