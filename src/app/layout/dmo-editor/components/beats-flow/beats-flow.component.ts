import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { computePosition } from '@floating-ui/core';
import { NodeScroll, Rect } from '@floating-ui/dom';
import { NnaTooltipService, TooltipOffsetOptions } from 'src/app/shared/services/nna-tooltip.service';
import { NnaBeatDto, NnaBeatTimeDto } from '../../models/dmo-dtos';

@Component({
	selector: 'app-beats-flow',
	templateUrl: './beats-flow.component.html',
	styleUrls: ['./beats-flow.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BeatsFlowComponent implements AfterViewInit, OnDestroy {

	@Input() initialBeats: NnaBeatDto[];
	@Input() isDmoFinished: boolean;
	@Input() updateBeatsEvent: EventEmitter<any>;
	@Input() focusElement: EventEmitter<any>;
	@Output() beatsSet: EventEmitter<any> = new EventEmitter<any>();
	@Output() lineCountChanged: EventEmitter<any> = new EventEmitter<any>();
	@Output() addBeat: EventEmitter<any> = new EventEmitter<any>();
	@Output() removeBeat: EventEmitter<any> = new EventEmitter<any>();
	@Output() syncBeats: EventEmitter<any> = new EventEmitter<any>();
	@Output() openBeatTypeTooltip: EventEmitter<any> = new EventEmitter<any>();
	@Output() closeBeatTypeTooltip: EventEmitter<any> = new EventEmitter<any>();

	isDataLoaded: boolean = false;
	beats: NnaBeatDto[];

	private beatsIds: string[] = [];
	private beatsMetaData: any[] = [];
	private defaultTimePickerValue = '0:00:00';
	private defaultEmptyTimePickerValue = ' :  :  ';
	private beatLineHeigth: number = 16;
	private beatContrainerMinHeight: number = 32;
	private onDownLines: any = {};
	private onUpLines: any = {};
	private valueBeforeRemove: string;
	private shiftIsPressed: boolean = false;
	private controlIsPressed: boolean = false;
	private tabIsPressed: boolean;
	private isTimePickerFocused: boolean = false;
	private isBeatDataHolderFocused: boolean = false;
	private beatDataholderWidht: number = 660;
	
	private specialHotKeys: any = { openBeatTypeTooltipKeyCode: 81, openCharacterTooltipKeyCode: 85 }; 
	// q for beat type tooltip
	// u for character tooltip

	@ViewChildren('timePickers') timePickersElements: QueryList<ElementRef>;
	@ViewChildren('beatDataHolders') beatDataHolderElements: QueryList<ElementRef>;

	@ViewChild('charactersTooltip') charactersTooltip: ElementRef;
	@ViewChild('charactersTooltipArrow') charactersTooltipArrow: ElementRef;

	constructor(private cdRef: ChangeDetectorRef, private nnaTooltipService: NnaTooltipService) {}


	ngAfterViewInit(): void {
		this.beats = this.initialBeats;
		this.isDataLoaded = true;

		this.setupBeats(null, null, true);
		this.setupEditorCallback();
		this.setupSubscription();
	}

	ngOnDestroy(): void {
		this.unsubscribeFromSpecialHotKeysListeners();
	}

	showCharactersTooltip(): void {
		const range = window.getSelection().getRangeAt(0);
		const span = document.createElement('span');
		range.insertNode(span);

		this.nnaTooltipService.addTooltip(
			'characters',
			span,
			this.charactersTooltip.nativeElement,
			{ 
				arrowNativeElenemt: this.charactersTooltipArrow.nativeElement,
				placement: 'bottom',
				removeHostElementAfter: true
			}
		);

		this.nnaTooltipService.showTooltip('characters');
	}


	hideCharactersTooltip(): void {
		this.nnaTooltipService.hideTooltip('characters');
		this.nnaTooltipService.removeTooltip('characters');
	}

  	// #region general settings

	private setupSubscription(): void {
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
				this.setupEditorCallback(update.actionName, update.actionMetaData);
			} else {
				this.setupEditorCallback();
			}
		});

		this.focusElement.subscribe((element) => {
			setTimeout(() => {
				this.isDiv(element) == true 
					? this.focusBeat(element.dataset.order)
					: this.focusTimePickerByIndex(element.dataset.order);
			}, 200);


		});
	}

	private handleGlobalKeydownEventWrapper = function($event) {
		this.handleGlobalKeydownEvent($event)
	}.bind(this);

	private subscribeToSpecialHotKeysListeners() {
		document.addEventListener('keydown', this.handleGlobalKeydownEventWrapper, { once: true });
	}

	private unsubscribeFromSpecialHotKeysListeners() {
		document.removeEventListener('keydown', this.handleGlobalKeydownEventWrapper);
	}

	private handleGlobalKeydownEvent($event: any): void {
		if (this.isTimePickerFocused == false && this.isBeatDataHolderFocused == false) {
			return;
		}

		if (!this.controlIsPressed) {
			return;
		}

		this.controlIsPressed = false;
 
		console.log('global handler keydown from BEATS FLOW');
		const key = $event.which || $event.keyCode || $event.charCode;
		if (key == this.specialHotKeys.openBeatTypeTooltipKeyCode) {
			$event.preventDefault();
			const currentElement = document.activeElement as HTMLElement;
			const beatId = this.isDiv(currentElement)
				? this.selectBeatIdFromBeatDataHolder(currentElement)
				: this.selectBeatIdFromTimePicker(currentElement);

				currentElement.blur();
				this.openBeatTypeTooltip.emit({ beatId, beatType: currentElement.dataset.beatType, elementToFocusAfterClose: currentElement });
				return;
		}

		if (key == this.specialHotKeys.openCharacterTooltipKeyCode) {
			$event.preventDefault();
			const currentElement = document.activeElement as HTMLElement;
			this.showCharactersTooltip();
			currentElement.blur();
			return;
		}
	}

	private isDiv(element: any): boolean {
		return element.nodeName == "DIV"
	}

	private setEditableElementsFocusMetaData(beatDataHolderFocused: boolean, timePickerFocused: boolean) {
		if (beatDataHolderFocused == true && timePickerFocused == true) {
			return; // timePicker and beatDataHolder can't be focused in the same time
		}
		if (beatDataHolderFocused == false && timePickerFocused == false) {
			this.isBeatDataHolderFocused = false;
			this.isTimePickerFocused = false;
			return;
		}

		if (beatDataHolderFocused == true) {
			this.isBeatDataHolderFocused = true;
			this.isTimePickerFocused = false;
		}
		if (timePickerFocused == true) {
			this.isTimePickerFocused = true;
			this.isBeatDataHolderFocused = false;
		}
	}

	private focusLastIfInitial(): void {
		let lastTimePickerElement = this.timePickersElements.last.nativeElement;
		let lastBeatElement = this.beatDataHolderElements.last.nativeElement;
		if (!lastBeatElement.innerHTML) {
			if (lastTimePickerElement.value == this.defaultTimePickerValue) {
				lastTimePickerElement.focus();
				this.scrollToElement(lastTimePickerElement);
				lastTimePickerElement.setSelectionRange(0,0);
			} else {
				lastBeatElement.focus();
				this.scrollToElement(lastBeatElement);
			}
		} else {
			this.shiftCursorToTheEndOfChildren(lastBeatElement.parentElement)
			this.scrollToElement(lastBeatElement);
		}
	}

	private setupBeats(timePickerToFocus: string = null, beatIdToFocus: string = null, isInitial: boolean = false): void {
		this.cdRef.detectChanges();
		this.setupTimePickerValues();
		this.setupBeatDataHolderValuesAndMetaData();
		this.setupLastBeatMargin();
		this.cdRef.detectChanges();

		if (timePickerToFocus != null) {
			this.beatsIds.forEach((beatId, i) => {
			if (beatId == timePickerToFocus) {
				const timePickerElement = this.timePickersElements.toArray()[i].nativeElement;
				timePickerElement.focus();
				this.scrollToElement(timePickerElement);
				timePickerElement.setSelectionRange(0,0);
				return;
			}
		});
		} else if (beatIdToFocus != null) {
			this.beatsIds.forEach((beatId, i) => {
				if (beatId == beatIdToFocus) {
					const beatDataHolderElement = this.beatDataHolderElements.toArray()[i].nativeElement;
					beatDataHolderElement.focus();
					this.scrollToElement(beatDataHolderElement);
					this.shiftCursorToTheEndOfChildren(beatDataHolderElement.parentElement);
					return;
				}
			});
		} else if (isInitial) {
			this.focusLastIfInitial();
		}
	}

	private setupEditorCallback(lastAction: string = null, actionMetaData: string = null): void {
		this.beatsSet.emit({
			timePickers: this.timePickersElements, 
			beats: this.beatDataHolderElements, 
			beatMetadata: this.beatsMetaData,
			beatsIds: this.beatsIds,
			lastAction: lastAction,
			lastActionMetaData: actionMetaData
		});
	}

	private scrollToElement(element: any): void {
		element.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
	}

  	// #endregion


	// #region key event handlers
	
	setTimePickerKeyMetaData($event: any, index: number): void {
		let key = $event.which || $event.keyCode || $event.charCode;
		if (((key < 48 || key > 59) &&  // numbers
			(key < 96 || key > 105)) && // numbers on numeric keyboard
			key != 8 && key != 46 &&    // delete and backspace
			key != 13 &&                // enter
			key != 32 &&                // space
			key != 17 &&				// control
			key != 9 &&                 // tab
			key != this.specialHotKeys.openBeatTypeTooltipKeyCode &&
			!(key == 37 || key == 38 || key == 39 || key == 40)) { // arrow keys
			$event.preventDefault();
			return;
		}

		if (key == 17) {
			this.controlIsPressed = navigator.platform.match("Mac") ? $event.metaKey : $event.ctrlKey;
			return;
		}

		if (key == this.specialHotKeys.openBeatTypeTooltipKeyCode && this.controlIsPressed) {
			this.subscribeToSpecialHotKeysListeners();
			return;
		}

		if (key == 13) { // enter
			this.focusBeat(index);
			$event.preventDefault();
			return;
		}

		if (key == 9) {
			this.tabIsPressed = true;
			$event.preventDefault();
			return;
		}

		if (key == 8 || key == 46 ) { // delete and backspace
			$event.preventDefault();
			this.shiftCursorOnColon($event.target, key);
			return;
		}

		if (key == 39) { // right arrow
			if ($event.target.selectionStart == 7 || this.tabIsPressed == true) {
				this.focusBeat(index);
				$event.preventDefault();
				return;
			}
			return;
		}

		if (key == 37) { // left arrow
			if ($event.target.selectionStart == 0 || this.tabIsPressed == true) {
				this.focusPreviousTimePicker(index);
				$event.preventDefault();
				return;
			}
			return;
		}

		if ((key == 40 || key == 38) && this.tabIsPressed == true) { // up and down arrow
			this.focusPreviousNextTimePicker(key, index);
			$event.preventDefault();
			return;
		}


		if (this.preventInvalidMinutesOrSeconds($event.target, +$event.key[0])) {
			this.setValidMinutesOrSeconds($event.target);
			this.preventSecondsIfMinutesAreMax($event.target, +$event.key[0]);
			$event.preventDefault();
			return;
		}

		this.preventSecondsIfMinutesAreMax($event.target, +$event.key[0]);

		if (this.replaceNextSpaceWithCharacter($event.target, +$event.key[0])) {
			$event.preventDefault();
			return;
		}
	}

	setTimePickerValue($event: any, index: number): void {
		let key = $event.which || $event.keyCode || $event.charCode;

		if (key == 17) { // control
			this.controlIsPressed = false;
			return;
		}

		if (key == 9) { // tab
			this.tabIsPressed = false;
			$event.preventDefault();
			return;
		}

		if (key == 13) { // enter
			$event.preventDefault();
			return;
		}

		if (key == 8 || key == 46 ) { // backspace and delete
			if (this.deleteBeatIfEmpty($event.target, key)) {
				$event.preventDefault();
				return;
			}
		}

		if ((key >= 48 && key <= 59)  || // numbers
			(key >= 96 && key <= 105) || // numbers on numeric keyboard
			key == 32 ||                 // space
			(key == 8 || key == 46)) {   // backspace and delete
			this.beatsMetaData[index].isDirty = true;
		}
	}
 
	finalizeTimePicker($event: any, index: number): void {
		$event.target.value = this.fillEmtpyTimeDto($event.target.value);
		this.setEditableElementsFocusMetaData(false, false);
		if ($event.relatedTarget == null) {
			if (this.beatsMetaData[index].isDirty == true) {
				this.syncBeats.emit({ source: 'time_picker_focus_out', metaData: index });
				this.beatsMetaData[index].isDirty = false;
			}
		} else {
			let beatId = this.selectBeatIdFromTimePicker($event.target);
			let timePickerId = this.selectBeatIdFromBeatDataHolder($event.relatedTarget);

			if (beatId != timePickerId) {
				if (this.beatsMetaData[index].isDirty == true) {
					this.syncBeats.emit({ source: 'time_picker_focus_out', metaData: index });
					this.beatsMetaData[index].isDirty = false;
				}
			}
		}
	}

	prepareTimePicker($event: any): void {
		this.closeBeatTypeTooltip.emit();
		this.setEditableElementsFocusMetaData(true, false);
		if ($event.target.value == this.defaultTimePickerValue) {
			$event.target.value = this.defaultEmptyTimePickerValue;
			$event.target.setSelectionRange(0, 0);
		} else {
			$event.target.setSelectionRange(8, 8);
		}
	}

	prepareBeatDataHolder() {
		this.closeBeatTypeTooltip.emit();
		this.setEditableElementsFocusMetaData(false, true);
	}

	beatContainerClick($event: any): void {
		if ($event.target.className == 'beat-data-holder-container') {
			$event.target.children[0].focus();
			this.shiftCursorToTheEndOfChildren($event.target);
		}
	}

	setBeatKeyMetaData($event: any, index: number): void {
		let key = $event.which || $event.keyCode || $event.charCode;

		if (key == 17) { // control
			this.controlIsPressed = navigator.platform.match("Mac") ? $event.metaKey : $event.ctrlKey;
		}

		if (key == this.specialHotKeys.openBeatTypeTooltipKeyCode && this.controlIsPressed) {
			this.subscribeToSpecialHotKeysListeners();
			return;
		}

		if (key == this.specialHotKeys.openCharacterTooltipKeyCode && this.controlIsPressed) {
			this.subscribeToSpecialHotKeysListeners();
			return;
		}


		if (key == 16) { // shift
			this.shiftIsPressed = true;
		} 

		if (key == 9) { // tab
			this.tabIsPressed = true;
			$event.preventDefault();
		}

		if (key == 37 || key == 38 || key == 39 || key == 40) { // arrow keys
			this.focusNextPreviousBeat(key, $event, index);
			return;
		}

		if (key == 13) { // enter
			if (this.shiftIsPressed == false) {
				$event.preventDefault();

				if (this.focusNextDefaultTimePicker($event) == true) {
					return;
				}

				if (this.beatsMetaData[index].isDirty == true) {
					this.syncBeats.emit({ source: 'beat_data_holder_focus_out', metaData: index });
					this.beatsMetaData[index].isDirty = false;
				}
				
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
			if (this.deleteBeatIfTextEmpty($event.target)) {
				$event.preventDefault();
				return;
			}
		}

		this.onUpLines = this.calculateLineCount($event.target);
		this.checkLineCounts($event.target);
	}

	finalizeBeat($event: any, index: number): void {
		this.clearInnerTagsIfBeatIsEmpty($event);
		this.setEditableElementsFocusMetaData(false, false);
		if ($event.relatedTarget == null) {
			if (this.beatsMetaData[index].isDirty == true) {
				this.syncBeats.emit({ source: 'beat_data_holder_focus_out', metaData: index });
				this.beatsMetaData[index].isDirty = false;
			}
		} else {
			let timePickerId = this.selectBeatIdFromTimePicker($event.relatedTarget);
			let beatId = this.selectBeatIdFromBeatDataHolder($event.target);

			if (beatId != timePickerId) {
				if (this.beatsMetaData[index].isDirty == true) {
					this.syncBeats.emit({ source: 'beat_data_holder_focus_out', metaData: index });
					this.beatsMetaData[index].isDirty = false;
				}
			}
		}
	}

	onBeatChanged(index: number): void {
		this.beatsMetaData[index].isDirty = true;
	}

	preventDrag($event: any): void {
		$event.dataTransfer.dropEffect = 'none'; 
		$event.preventDefault();
	}
	

	// #endregion


    // #region beat data holders (helpers)

	private deleteBeatIfTextEmpty(nativeElement: any): boolean {
		if (nativeElement.innerHTML.replace(/\s+/g, '').length == 0 && this.beatsIds.length != 1) {
			if (this.valueBeforeRemove == '') {
				this.removeBeat.emit({beatIdToRemove: this.selectBeatIdFromBeatDataHolder(nativeElement)});
				return true;
			}
		}
		return false;
	}

	private focusNextDefaultTimePicker($event: any): boolean {
		let currentBeatId = this.selectBeatIdFromBeatDataHolder($event.target)
		let currentPosition: number; 
		this.beatDataHolderElements.find((beatHolders, i) => {
			if (this.selectBeatIdFromBeatDataHolder(beatHolders.nativeElement) == currentBeatId) {
				currentPosition = i;
				return true;
			}
			return false;
		});


		if (currentPosition != null && currentPosition == this.beatDataHolderElements.length - 1) {
			return false;
		}


		const isNextBeatAesthetic = this.beats[currentPosition + 1].type == 4;
		const isBeatEmtpy = this.beatDataHolderElements.toArray()[currentPosition + 1].nativeElement.innerText == '';
		if (isNextBeatAesthetic == true && isBeatEmtpy == true) {
			this.focusBeat(currentPosition + 1);
			return true;
		}

		const isTimePickerEmpty = this.timePickersElements.toArray()[currentPosition + 1].nativeElement.value == this.defaultTimePickerValue;
		if (isBeatEmtpy == true && isTimePickerEmpty == true) {
			this.focusTimePicker(this.timePickersElements.toArray()[currentPosition + 1].nativeElement);
			return true;

		}

		return false;
	}

	private clearInnerTagsIfBeatIsEmpty($event: any): void {
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

	private focusNextPreviousBeat(key: number, $event: any, index: number): void {
		if (key == 38) { // up
			if (this.tabIsPressed) {
				if (index != 0) {
					$event.preventDefault();
					this.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[index - 1].nativeElement.parentElement);
					return;
				}
			}
			return;
		} else if (key == 40 || key == 39) { // down or right
			if (this.tabIsPressed) {
				if (index != this.beatsIds.length - 1) {
					$event.preventDefault();
					this.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[index + 1].nativeElement.parentElement);
					return;
				}
			}
			return;
		} else if (key == 37) { // left
			if (this.tabIsPressed) {
				$event.preventDefault();
				this.focusTimePicker(this.timePickersElements.toArray()[index].nativeElement);
				return;
			}
		}
	}

	private checkLineCounts(element: any): void {
		let lastUp = this.onUpLines;
		let lastDown = this.onDownLines;

		if (lastDown.lines < lastUp.lines ) {
			this.lineCountChanged.emit({beatId: this.selectBeatIdFromBeatDataHolder(element), newLineCount: lastUp});
		} else if (lastDown.lines > lastUp.lines) {
			this.lineCountChanged.emit({beatId: this.selectBeatIdFromBeatDataHolder(element), newLineCount: lastUp});
		}
	}

	private setupLastBeatMargin(): void {
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
			beatDataHolder.nativeElement.dataset.beatType = beat.type;
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

	private shiftCursorToTheEndOfChildren(dataHolderContainer: any): void {
		if (!dataHolderContainer.children) {
			return;
		}

		let range = document.createRange();
		let dataHolder = dataHolderContainer.lastChild;

		if (!dataHolder.lastChild) {
			dataHolder.focus();
			this.scrollToElement(dataHolder);
			return;
		} else {
			if (dataHolder.lastChild.nodeType == 3) { // TEXT_NODE
				range.setStart(dataHolder.lastChild, dataHolder.lastChild.textContent.length);
			} else { // any other element
				if (dataHolder.lastChild.lastChild) {
					range.setStart(dataHolder.lastChild.lastChild, dataHolder.lastChild.lastChild.textContent.length);
				} else {
					dataHolder.focus();
					this.scrollToElement(dataHolder);
				}
			}

			range.collapse(true)
			let selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

    // #endregion


  	// #region time picker (helpers)

	private deleteBeatIfEmpty(nativeElement: any, key: any): boolean {
		let beatWasDeleted = false;
		
		if (nativeElement.value == this.defaultEmptyTimePickerValue) {
			const beatIdFromTimePicker = this.selectBeatIdFromTimePicker(nativeElement)
			this.beatDataHolderElements.forEach((beatDataHolder) => {
				if (this.selectBeatIdFromBeatDataHolder(beatDataHolder.nativeElement) == beatIdFromTimePicker) {
					const text = beatDataHolder.nativeElement.innerHTML;
					if (text.replace(/\s+/g, '').length == 0 && this.beatsIds.length != 1) {
						this.removeBeat.emit({beatIdToRemove: beatIdFromTimePicker});
						beatWasDeleted = true;
						return;
					}
				}
			});
		} else {
			this.replaceRemovedCharacterWithSpace(nativeElement, key);
		}

		return beatWasDeleted;
	}

	private focusTimePickerByIndex(index) {
		if (this.beats[index].type == 4) {
			this.focusBeat(index);
			return;
		}
		this.focusTimePicker(this.timePickersElements.toArray()[index].nativeElement);
	}

	private focusTimePicker(nativeElement: any): void {
		nativeElement.focus();
		this.scrollToElement(nativeElement);
		if (nativeElement.value == this.defaultEmptyTimePickerValue) {
			nativeElement.setSelectionRange(0,0);
		} else {
			nativeElement.setSelectionRange(8,8);
			setTimeout(() => {nativeElement.setSelectionRange(8,8); }, 10);
		}
	}

	private setupTimePickerValues(): void {
		this.timePickersElements.forEach((picker) => {
			const beat = this.beats.find((b: NnaBeatDto)=> b.beatId == this.selectBeatIdFromTimePicker(picker.nativeElement));
			if (!beat) {
				return;
			}
			picker.nativeElement.dataset.beatType = beat.type;
			if (beat.type == 4) {
				picker.nativeElement.value = this.defaultTimePickerValue;
				picker.nativeElement.style.display = 'none';
			} else {
				picker.nativeElement.value = this.adjastSingleMinutesAndSeconds(this.getTimeView(beat.time, true));
			}
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
		let time = value.replace(/ /g, '0');
		time = time.replace(/:+/g, '0');

		return `${time[0]}:${this.fixInvalidMinutesOrSeconds(time[2],time[3])}:${this.fixInvalidMinutesOrSeconds(time[5], time[6])}`;
	}

	private fixInvalidMinutesOrSeconds(firstNum: string, secondNum: string): string {
		if (+firstNum > 6) {
			return '60';
		}
		return `${firstNum}${secondNum}`;
	}

	private preventSecondsIfMinutesAreMax(nativeElement: any, value: number): void {
		const start = nativeElement.selectionStart;

		if (start != 5 && start != 6 && start != 4) {
			return;
		}

		if (nativeElement.value[2] != '6') {
			return;
		}

		nativeElement.value = nativeElement.value.substring(0, 5) + '00';
		nativeElement.selectionStart = 7;
		nativeElement.selectionEnd = 7;
	}

	private setValidMinutesOrSeconds(nativeElement: any): void {
		const start = nativeElement.selectionStart;

		if (start == 2 || start == 5) {
			if (nativeElement.value[start] == ' ') {
				nativeElement.value = nativeElement.value.substring(0, start) + '5' + nativeElement.value.substring(start + 1);
				nativeElement.selectionStart = start + 1;
				nativeElement.selectionEnd = start + 1;
			}
		} else if (start == 1 || start == 4) {
			if (nativeElement.value[start+1] == ' ') {
				nativeElement.value = nativeElement.value.substring(0, start + 1) + '5' + nativeElement.value.substring(start + 2);
				nativeElement.selectionStart = start + 2;
				nativeElement.selectionEnd = start + 2;
			}
		} 
	}

	private preventInvalidMinutesOrSeconds(nativeElement: any, value: number): boolean {
		if (Number.isNaN(value)) {
			return false;
		}

		const start = nativeElement.selectionStart;
		if (start == 2 || start == 5 || start == 1 || start == 4) {
			return value > 5;
		}
		
		return false;
	}

	private replaceNextSpaceWithCharacter(nativeElement: any, value: number): boolean {
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

	private replaceRemovedCharacterWithSpace(nativeElement: any, key: number): void {
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

	private replaceWith(value: string, index: number, replace: string): string {
		return `${value.substr(0, index)}${replace}${value.substr(index + 1)}`;
	}

	private focusBeat(index: number): void {
		this.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[index].nativeElement.parentElement);
	}

	private focusBeatByElement(nativeEnement: any): void {
		this.shiftCursorToTheEndOfChildren(nativeEnement);
	}

	private focusPreviousNextTimePicker(key: number, index: number): void {
		if (key == 38) { // up
			this.focusPreviousTimePicker(index);
		} else if (key == 40) { // down
			this.focusNextTimePicker(index);
		}
	}

	private focusPreviousTimePicker(index: number): void {
		if (index == 0) {
			return;
		}

		for (let i = index - 1; i >= 0; i--) {
			if (this.beats[i].type == 4) {
				this.focusPreviousTimePicker(i - 1);
				continue;
			}
			this.focusTimePicker(this.timePickersElements.toArray()[i].nativeElement)
			break;
		}
	}

	private focusNextTimePicker(index: number): void {
		if (index == this.beats.length - 1) {
			return;
		}

		for (let i = index + 1; i <= this.beats.length - 1; i++) {
			if (this.beats[i].type == 4) { 
				this.focusNextTimePicker(i + 1);
				continue;
			}
			this.focusTimePicker(this.timePickersElements.toArray()[i].nativeElement);
			break;
		}
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
