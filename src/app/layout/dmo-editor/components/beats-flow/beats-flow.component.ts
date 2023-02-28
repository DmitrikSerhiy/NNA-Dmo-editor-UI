import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { NnaTagWithoutDescriptionDto } from 'src/app/layout/models';
import { CachedTagsService } from 'src/app/shared/services/cached-tags.service';
import { NnaHelpersService } from 'src/app/shared/services/nna-helpers.service';
import { NnaTooltipService, TooltipOffsetOptions } from 'src/app/shared/services/nna-tooltip.service';
import { EditorSharedService } from '../../../../shared/services/editor-shared.service';
import { NnaBeatDto, NnaCharacterTagName, NnaMovieCharacterDto, NnaMovieCharacterInDmoDto, NnaTagElementName } from '../../models/dmo-dtos';

@Component({
	selector: 'app-beats-flow',
	templateUrl: './beats-flow.component.html',
	styleUrls: ['./beats-flow.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BeatsFlowComponent implements AfterViewInit, OnDestroy {

	@Input() initialBeats: NnaBeatDto[];
	@Input() initialCharacters: NnaMovieCharacterInDmoDto[];
	@Input() isDmoFinished: boolean;
	@Input() updateBeatsEvent: EventEmitter<any>;
	@Input() updateCharactersEvent: EventEmitter<any>;
	@Input() focusElement: EventEmitter<any>;
	@Output() beatsSet: EventEmitter<any> = new EventEmitter<any>();
	@Output() lineCountChanged: EventEmitter<any> = new EventEmitter<any>();
	@Output() addBeat: EventEmitter<any> = new EventEmitter<any>();
	@Output() removeBeat: EventEmitter<any> = new EventEmitter<any>();
	@Output() syncBeats: EventEmitter<any> = new EventEmitter<any>();
	@Output() openBeatTypeTooltip: EventEmitter<any> = new EventEmitter<any>();
	@Output() openCharactersPopup: EventEmitter<any> = new EventEmitter<any>();
	@Output() syncCharactersInDmo: EventEmitter<any> = new EventEmitter<any>();
	@Output() syncTagsInBeats: EventEmitter<any> = new EventEmitter<any>();
	@Output() reloadBeats: EventEmitter<void> = new EventEmitter<void>();

	isDataLoaded: boolean = false;
	beats: NnaBeatDto[];
	characters: NnaMovieCharacterInDmoDto[];
	filtredCharacters: NnaMovieCharacterDto[];
	allTags: NnaTagWithoutDescriptionDto[];
	filtredTags: NnaTagWithoutDescriptionDto[];

	private beatsIds: string[] = [];
	private beatsMetaData: any[] = [];

	private beatLineHeigth: number;
	private beatContrainerMinHeight: number;
	private onDownLines: any = {};
	private onUpLines: any = {};
	private valueBeforeRemove: string;
	private tabIsPressed: boolean;
	private isTimePickerFocused: boolean = false;
	private isBeatDataHolderFocused: boolean = false;
	private editorHotKeys: any = { openBeatTypeTooltipKeyCode: 81, openCharacterTooltipKeyCode: 50, openTagTooltipKeyCode: 51 };
	// q for beat type tooltip
	// 2 + shift for character tooltip
	// 3 + shift = # for tags tooltip

	private characterPlaceHolderClass: string = 'character-placeolder';
	private tagPlaceHolderClass: string = 'tag-placeholder'

	@ViewChildren('timePickers') timePickersElements: QueryList<ElementRef>;
	@ViewChildren('beatDataHolders') beatDataHolderElements: QueryList<ElementRef>;

	@ViewChild('charactersTooltip') charactersTooltip: ElementRef;
	@ViewChild('charactersTooltipArrow') charactersTooltipArrow: ElementRef;
	@ViewChild('characterFilterInput') characterFilterInputElement: ElementRef;
	@ViewChildren('charactersOptions') charactersOptionsElements: QueryList<ElementRef>;

	@ViewChild('tagsTooltip') tagsTooltipElement: ElementRef;
	@ViewChild('tagTooltipArrow') tagTooltipArrowElement: ElementRef;
	@ViewChild('tagFilterInput') tagFilterInputElement: ElementRef;
	@ViewChildren('tagsOptions') tagsOptionsElements: QueryList<ElementRef>;

	constructor(
		private cdRef: ChangeDetectorRef,
		private nnaTooltipService: NnaTooltipService,
		public editorSharedService: EditorSharedService,
		private nnaHelpersService: NnaHelpersService,
		private tagsService: CachedTagsService) {
			this.beatLineHeigth = editorSharedService.beatLineHeigth;
			this.beatContrainerMinHeight = editorSharedService.beatContrainerMinHeight;
		}


	async ngAfterViewInit(): Promise<void> {
		this.beats = this.initialBeats;
		this.characters = this.initialCharacters;
		this.isDataLoaded = true;
		this.allTags = await this.tagsService.getAllTags();
		this.filtredTags = [...this.allTags];

		this.setupBeats(null, null, true);
		this.setupEditorCallback();
		this.setupSubscription();
	}

	ngOnDestroy(): void {
		this.unsubscribeFromSpecialHotKeysListeners();
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

		this.updateCharactersEvent.subscribe(update => {
			const previousCharacters = [...this.characters];
			this.characters = [...update.characters];
			let shouldReloadBeats: boolean = false;
			let shouldSanitizeDeletedCharactersInBeats: boolean = false;

			if (!update.operations?.length) {
				return;
			}

			if (update.operations.length == 1 && update.operations[0] == 'add') {
				return;
			}

			if (update.operations.includes('edit')) {
				shouldReloadBeats = true;
			}

			if (update.operations.includes('delete')) {
				shouldSanitizeDeletedCharactersInBeats = true;
			}

			if (shouldSanitizeDeletedCharactersInBeats == true) {
				const removedCharacters = previousCharacters.filter(character => this.characters.findIndex(cha => cha.id == character.id) == -1);
				if (removedCharacters?.length > 0) {
					const usedRemovedCharacters = removedCharacters.filter(character => character.count > 0);
					if (usedRemovedCharacters?.length > 0) {
						this.reloadBeats.emit();
					}
					return;
				}
			}

			if (shouldReloadBeats == true) {
				let editedCharacters = previousCharacters.filter(character =>
					(this.characters.findIndex(cha => cha.name == character.name) == -1) ||
					(this.characters.findIndex(cha => cha.aliases == character.aliases) == -1) ||
					(this.characters.findIndex(cha => cha.color == character.color) == -1));

				editedCharacters = this.characters.filter(character => editedCharacters.findIndex(cha => cha.id == character.id) != -1);
				if (editedCharacters?.length > 0) {
					const usedEditedCharacters = editedCharacters.filter(character => character.count > 0);
					if (usedEditedCharacters?.length > 0 ) {
						this.reloadBeats.emit();
						return;
					}
				}
			}
		});

		this.focusElement.subscribe((element) => {
			setTimeout(() => {
				this.editorSharedService.isDiv(element) == true
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

		if (!$event.ctrlKey) {
			return;
		}

		const key = $event.which || $event.keyCode || $event.charCode;
		if (key == this.editorHotKeys.openBeatTypeTooltipKeyCode) {
			$event.preventDefault();
			console.log('global handler keydown from BEATS FLOW');
			const currentElement = document.activeElement as HTMLElement;
			const beatId = this.editorSharedService.isDiv(currentElement)
				? this.editorSharedService.selectBeatIdFromBeatDataHolder(currentElement)
				: this.editorSharedService.selectBeatIdFromTimePicker(currentElement);

				currentElement.blur();
				this.openBeatTypeTooltip.emit({ beatId, beatType: currentElement.dataset.beatType, elementToFocusAfterClose: currentElement });
				return;
		}
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
			if (lastTimePickerElement.value == this.editorSharedService.defaultTimePickerValue) {
				lastTimePickerElement.focus();
				this.editorSharedService.scrollToElement(lastTimePickerElement);
				lastTimePickerElement.setSelectionRange(0,0);
			} else {
				lastBeatElement.focus();
				this.editorSharedService.scrollToElement(lastBeatElement);
			}
		} else {
			this.editorSharedService.shiftCursorToTheEndOfChildren(lastBeatElement.parentElement)
			this.editorSharedService.scrollToElement(lastBeatElement);
		}
	}

	private setupBeats(timePickerToFocus: string = null, beatIdToFocus: string = null, isInitial: boolean = false): void {
		this.cdRef.detectChanges();
		this.setupTimePickerValues();
		this.setupBeatDataHolderValuesAndMetaData(isInitial);
		this.setupLastBeatMargin();
		this.cdRef.detectChanges();

		if (timePickerToFocus != null) {
			this.beatsIds.forEach((beatId, i) => {
			if (beatId == timePickerToFocus) {
				const timePickerElement = this.timePickersElements.toArray()[i].nativeElement;
				timePickerElement.focus();
				this.editorSharedService.scrollToElement(timePickerElement);
				timePickerElement.setSelectionRange(0,0);
				return;
			}
		});
		} else if (beatIdToFocus != null) {
			this.beatsIds.forEach((beatId, i) => {
				if (beatId == beatIdToFocus) {
					const beatDataHolderElement = this.beatDataHolderElements.toArray()[i].nativeElement;
					beatDataHolderElement.focus();
					this.editorSharedService.scrollToElement(beatDataHolderElement);
					this.editorSharedService.shiftCursorToTheEndOfChildren(beatDataHolderElement.parentElement);
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
			key != this.editorHotKeys.openBeatTypeTooltipKeyCode &&
			!(key == 37 || key == 38 || key == 39 || key == 40)) { // arrow keys
			$event.preventDefault();
			return;
		}

		if (key == this.editorHotKeys.openBeatTypeTooltipKeyCode) {
			if ($event.ctrlKey) {
				this.subscribeToSpecialHotKeysListeners();
				return;
			}
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
			if ($event.ctrlKey) {
				this.deleteBeat($event.target, true);
				return;
			}
			$event.preventDefault();
			this.shiftCursorOnColon($event.target, key);
			return;
		}

		if (key == 39) { // right arrow
			if (this.tabIsPressed == true /*|| $event.target.selectionStart == 7 */ ) {
				this.focusBeat(index);
				$event.preventDefault();
				return;
			}
			return;
		}

		if (key == 37) { // left arrow
			if (this.tabIsPressed == true /*|| $event.target.selectionStart == 0 */ ) {
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
			let beatId = this.editorSharedService.selectBeatIdFromTimePicker($event.target);
			let timePickerId = this.editorSharedService.selectBeatIdFromBeatDataHolder($event.relatedTarget);

			if (beatId != timePickerId) {
				if (this.beatsMetaData[index].isDirty == true) {
					this.syncBeats.emit({ source: 'time_picker_focus_out', metaData: index });
					this.beatsMetaData[index].isDirty = false;
				}
			}
		}
	}

	prepareTimePicker($event: any): void {
		this.nnaTooltipService.hideAllTooltips();
		this.setEditableElementsFocusMetaData(true, false);
		if ($event.target.value == this.editorSharedService.defaultTimePickerValue) {
			$event.target.value = this.editorSharedService.defaultEmptyTimePickerValue;
			$event.target.setSelectionRange(0, 0);
		} else {
			$event.target.setSelectionRange(8, 8);
		}
		// this.scrollToElement($event.target); // looks really anoying // creates bug when user click on character tag to remove it.
	}

	prepareBeatDataHolder($event: any) {
		this.nnaTooltipService.hideAllTooltips();
		this.setEditableElementsFocusMetaData(false, true);
		// this.scrollToElement($event.target); // looks really anoying // creates bug when user click on character tag to remove it.
	}

	beatContainerClick($event: any): void {
		if ($event.target.className == 'beat-data-holder-container') {
			$event.target.children[0].focus();
			this.editorSharedService.shiftCursorToTheEndOfChildren($event.target);
		}
	}

	setBeatKeyMetaData($event: any, index: number): void {
		const key = $event.which || $event.keyCode || $event.charCode;

		if (key == this.editorHotKeys.openBeatTypeTooltipKeyCode || key == this.editorHotKeys.openCharacterTooltipKeyCode) {
			if ($event.ctrlKey) {
				this.subscribeToSpecialHotKeysListeners();
				return;
			}
		}

		if (key == this.editorHotKeys.openCharacterTooltipKeyCode && $event.shiftKey) {
			$event.preventDefault();
			this.showCharactersTooltip($event.target);
			$event.target.blur();
			return;
		}

		if (key == this.editorHotKeys.openTagTooltipKeyCode && $event.shiftKey) {
			$event.preventDefault();
			this.showTagTooltip($event.target);
			$event.target.blur();
			return;
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
			if (!$event.shiftKey) {
				$event.preventDefault();

				if (this.focusNextDefaultTimePicker($event) == true) {
					return;
				}

				if (this.beatsMetaData[index].isDirty == true) {
					this.syncBeats.emit({ source: 'beat_data_holder_focus_out', metaData: index });
					this.beatsMetaData[index].isDirty = false;
				}

				this.addBeat.emit({ beatIdFrom: this.editorSharedService.selectBeatIdFromBeatDataHolder($event.target) });
			}
			return;
		}

		if (key == 8 || key == 46) { // delete or backspace
			if ($event.ctrlKey) {
				this.deleteBeat($event.target, false);
				return;
			}
			this.valueBeforeRemove = $event.target.innerHTML;
		}

		this.onDownLines = this.editorSharedService.calculateLineCount($event.target);
	}

	setBeatValue($event: any): void {
		let key = $event.which || $event.keyCode || $event.charCode;

		if (key == 9) { // tab
			this.tabIsPressed = false;
			$event.preventDefault();
		}

		if (key == 37 || key == 38 || key == 39 || key == 40) { // arrow keys
			return;
		}

		if (key == 13) { // enter
			if (!$event.shiftKey) {
				$event.preventDefault();
				return;
			}
		}

		if (key == 8 || key == 46) { // delete or backspace
			if (this.deleteBeatIfTextEmpty($event.target)) {
				$event.preventDefault();
				return;
			}

			this.deleteInnerTagIfItSingle($event.target);
		}

		this.onUpLines = this.editorSharedService.calculateLineCount($event.target);
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
			let timePickerId = this.editorSharedService.selectBeatIdFromTimePicker($event.relatedTarget);
			let beatId = this.editorSharedService.selectBeatIdFromBeatDataHolder($event.target);

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

	// #endregion


    // #region beat data holders (helpers)

	private deleteBeatIfTextEmpty(nativeElement: any): boolean {
		if (nativeElement.innerHTML.replace(/\s+/g, '').length == 0 && this.beatsIds.length != 1) {
			if (this.valueBeforeRemove == '') {
				this.removeBeat.emit({beatIdToRemove: this.editorSharedService.selectBeatIdFromBeatDataHolder(nativeElement)});
				return true;
			}
		}
		return false;
	}

	private deleteInnerTagIfItSingle(nativeElement: any) {
		[ ...nativeElement.childNodes ].filter(node => (node.nodeType == 3 && node.nodeValue == '') || node.nodeName == "BR").forEach(node => node.remove());
		let children = [ ...nativeElement.childNodes ];
		
		let customTags = children.filter(node => 
			node.nodeName.toLowerCase() == NnaCharacterTagName.toLowerCase() || 
			node.nodeName.toLowerCase() == NnaTagElementName
		);

		
		if (customTags.length == 1 && children.filter(node => node.nodeType == 3 ).length == 0) {
			customTags.forEach(child => child.remove());
			children.filter(node => node.nodeName == "BR").forEach(child => child.remove());
		}
	}

	private deleteBeat(nativeElement: any, fromTimePicker: boolean): void {
		if (fromTimePicker == true) {
			this.removeBeat.emit({beatIdToRemove: this.editorSharedService.selectBeatIdFromTimePicker(nativeElement)});
		} else {
			this.removeBeat.emit({beatIdToRemove: this.editorSharedService.selectBeatIdFromBeatDataHolder(nativeElement)});
		}

	}

	private focusNextDefaultTimePicker($event: any): boolean {
		let currentBeatId = this.editorSharedService.selectBeatIdFromBeatDataHolder($event.target)
		let currentPosition: number;
		this.beatDataHolderElements.find((beatHolders, i) => {
			if (this.editorSharedService.selectBeatIdFromBeatDataHolder(beatHolders.nativeElement) == currentBeatId) {
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

		const isTimePickerEmpty = this.timePickersElements.toArray()[currentPosition + 1].nativeElement.value == this.editorSharedService.defaultTimePickerValue;
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

		if([ ...$event.target.childNodes ].some(node => node.nodeName.toLowerCase() == NnaCharacterTagName.toLowerCase() || node.nodeName.toLowerCase() == NnaTagElementName)) {
			return;
		}

		if ($event.target.childNodes.length == 1) {
			if ($event.target.lastChild.nodeType == 3 ) {
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
					this.editorSharedService.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[index - 1].nativeElement.parentElement);
					return;
				}
			}
			return;
		} else if (key == 40 || key == 39) { // down or right
			if (this.tabIsPressed) {
				if (index != this.beatsIds.length - 1) {
					$event.preventDefault();
					this.editorSharedService.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[index + 1].nativeElement.parentElement);
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
			this.lineCountChanged.emit({beatId: this.editorSharedService.selectBeatIdFromBeatDataHolder(element), newLineCount: lastUp});
		} else if (lastDown.lines > lastUp.lines) {
			this.lineCountChanged.emit({beatId: this.editorSharedService.selectBeatIdFromBeatDataHolder(element), newLineCount: lastUp});
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

	private setupBeatDataHolderValuesAndMetaData(initialLoad: boolean = false): void {
		this.beatsMetaData = [];
		this.beatsIds = [];

		this.beatDataHolderElements.forEach((beatDataHolder) => {
			let beat = this.beats.find(b => b.beatId == this.editorSharedService.selectBeatIdFromBeatDataHolder(beatDataHolder.nativeElement));
			if (!beat) {
				return;
			}

			beatDataHolder.nativeElement.innerHTML = this.editorSharedService.getBeatText(beat, initialLoad, true);
			beatDataHolder.nativeElement.dataset.beatType = beat.type;
			this.beatsMetaData.push(this.editorSharedService.calculateLineCount(beatDataHolder.nativeElement));
			this.beatsIds.push(beat.beatId);
		});

		let characterTags = document.querySelectorAll<HTMLElement>(NnaCharacterTagName);
		if (characterTags?.length > 0) {
			this.editorSharedService.setCharactersClaims();
			characterTags.forEach(characterTag => {
				this.addEventListenerForCharacterTag(characterTag);
				this.observeCharacterTag(characterTag);
			});
		}

		let nnaTagElements = document.querySelectorAll<HTMLElement>(NnaTagElementName);
		if (nnaTagElements?.length > 0) {
			nnaTagElements.forEach(tagElement => {
				this.addEventListenerForNnaTagElements(tagElement);
				this.observeNnaTagElement(tagElement);
			});
		}
	}

    // #endregion


  	// #region time picker (helpers)

	private deleteBeatIfEmpty(nativeElement: any, key: any): boolean {
		let beatWasDeleted = false;

		if (nativeElement.value == this.editorSharedService.defaultEmptyTimePickerValue) {
			const beatIdFromTimePicker = this.editorSharedService.selectBeatIdFromTimePicker(nativeElement)
			this.beatDataHolderElements.forEach((beatDataHolder) => {
				if (this.editorSharedService.selectBeatIdFromBeatDataHolder(beatDataHolder.nativeElement) == beatIdFromTimePicker) {
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
		this.editorSharedService.scrollToElement(nativeElement);
		if (nativeElement.value == this.editorSharedService.defaultEmptyTimePickerValue) {
			nativeElement.setSelectionRange(0,0);
		} else {
			nativeElement.setSelectionRange(8,8);
			setTimeout(() => {nativeElement.setSelectionRange(8,8); }, 10);
		}
	}

	private setupTimePickerValues(): void {
		this.timePickersElements.forEach((picker) => {
			const beat = this.beats.find((b: NnaBeatDto)=> b.beatId == this.editorSharedService.selectBeatIdFromTimePicker(picker.nativeElement));
			if (!beat) {
				return;
			}
			picker.nativeElement.dataset.beatType = beat.type;
			if (beat.type == 4) {
				picker.nativeElement.value = this.editorSharedService.defaultTimePickerValue;
				picker.nativeElement.style.display = 'none';
			} else {
				picker.nativeElement.value = this.editorSharedService.getBeatTime(beat.time, true);
			}
		});
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

		nativeElement.value = this.editorSharedService.replaceWith(initialValue, start, value.toString());
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
		nativeElement.value = this.editorSharedService.replaceWith(initialValue, start -1, " ");
		nativeElement.setSelectionRange(start - 1, start - 1);
		} else if (key == 46) { // delete
			if (start == 7) {
				return;
			}
			nativeElement.value = this.editorSharedService.replaceWith(initialValue, start, " ");
			nativeElement.setSelectionRange(start, start);
		}
	}

	private focusBeat(index: number): void {
		this.editorSharedService.shiftCursorToTheEndOfChildren(this.beatDataHolderElements.toArray()[index].nativeElement.parentElement);
	}

	private focusBeatByElement(nativeEnement: any, scrollToBeat: boolean = false): void {
		this.editorSharedService.shiftCursorToTheEndOfChildren(nativeEnement, scrollToBeat);
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


	// #region characters management

	pickCharacter(character: NnaMovieCharacterDto): void {
		const beatId = this.nnaTooltipService.getTooltipMetadata(this.nnaTooltipService.charactersTooltipName).beatId;
		const beatDataHolder = this.nnaTooltipService.getHostingElementFromTooltip(this.nnaTooltipService.charactersTooltipName);
		const characterTag = this.editorSharedService.createCharacterTag(character.id, character.name, character.color, beatId);
		this.addEventListenerForCharacterTag(characterTag);

		this.syncCharactersInDmo.emit({operation: 'attach', data: {id: characterTag.dataset.id, beatId: beatId, characterId: character.id }} );
		this.insertCharacterTagIntoPlaceholder(characterTag);
		this.nnaTooltipService.hideTooltip(this.nnaTooltipService.charactersTooltipName, true);

		this.characters = this.characters.map(characterInDmo => {
			if (characterInDmo.id == character.id) {
				characterInDmo.count++;
			}
			return characterInDmo;
		}).sort((cha1, cha2) => cha2.count - cha1.count);

		this.editorSharedService.setCharactersClaims();
		const beatIndex = this.beatsIds.indexOf(beatId);
		this.beatsMetaData[beatIndex].isDirty = true;
		this.syncBeats.emit({ source: 'attach_character_to_beat', metaData: beatIndex });
		this.beatsMetaData[beatIndex].isDirty = false;
		this.focusBeatByElement(beatDataHolder.parentElement);
	}

	removeCharacter(characterTag: HTMLElement): void {
		this.syncCharactersInDmo.emit({operation: 'detach', data: { id: characterTag.dataset.id, beatId: characterTag.dataset.beatId }} );
		characterTag.remove();
		const beatIndex = this.beatsIds.indexOf(characterTag.dataset.beatId);

		this.characters = this.characters.map(characterInDmo => {
			if (characterInDmo.id == characterTag.dataset.characterId) {
				characterInDmo.count--;
			}
			return characterInDmo;
		}).sort((cha1, cha2) => cha2.count - cha1.count);

		this.editorSharedService.setCharactersClaims();
		this.beatsMetaData[beatIndex].isDirty = true;
		this.syncBeats.emit({ source: 'detach_character_from_beat', metaData: beatIndex });
		this.beatsMetaData[beatIndex].isDirty = false;
	}

	showCharactersTooltip(hostingElement: any): void {
		hostingElement.appendChild(document.createTextNode('@'));
		this.filtredCharacters = this.characters;
		const range = window.getSelection().getRangeAt(0);
		range.collapse(false);
		const characterPlaceHolderElement = document.createElement('span');
		characterPlaceHolderElement.classList.add(this.characterPlaceHolderClass);
		range.insertNode(characterPlaceHolderElement);

		this.nnaTooltipService.addTooltip(
			this.nnaTooltipService.charactersTooltipName,
			hostingElement,
			this.charactersTooltip.nativeElement,
			{
				arrowNativeElenemt: this.charactersTooltipArrow.nativeElement,
				placement: 'bottom',
				tooltipMetadata: { beatId: this.editorSharedService.selectBeatIdFromBeatDataHolder(hostingElement) },
				callbackAfterHide: this.charactersTooltipHideCallback,
				offset:  { mainAxis: 5, crossAxis: 10 } as TooltipOffsetOptions
			},
			characterPlaceHolderElement
		);

		this.resetCharacterFilter();

		const previouslySelectedCharacters = document.querySelectorAll<HTMLElement>('.selected-character-option');
		previouslySelectedCharacters?.forEach(characterOpiton => {
			characterOpiton.classList.remove('selected-character-option');
		});


		this.nnaTooltipService.showTooltip(this.nnaTooltipService.charactersTooltipName);

		setTimeout(() => {
			this.characterFilterInputElement?.nativeElement?.focus();
		}, 200);

		document.addEventListener('keydown', this.addCharactersTooltipEventHandlersWrapper);
	}

	filterCharacters(filterValue: string): void {
		const formedFilterValue = filterValue?.trim()?.toLowerCase();
		if (formedFilterValue == '') {
			this.resetCharacterFilter();
			return;
		}

		this.filtredCharacters = this.filtredCharacters.filter(character =>
			character.name.toLowerCase().includes(formedFilterValue) || character.aliases.toLowerCase().includes(formedFilterValue));
		}

	private resetCharacterFilter() {
		this.filtredCharacters = this.characters.sort(cha => cha.count);
		if (this.characterFilterInputElement) {
			this.characterFilterInputElement.nativeElement.value = '';
		}
	}

	onOpenCharactersPopup($event: any) {
		this.openCharactersPopup.emit({action: $event});
	}

	private insertCharacterTagIntoPlaceholder(characterTag: HTMLElement): void {
		const characterPlaceHolderElement = document.querySelector(`.${this.characterPlaceHolderClass}`);
		characterPlaceHolderElement.parentNode.insertBefore(characterTag, characterPlaceHolderElement);
		this.observeCharacterTag(characterTag);
	}

	private addEventListenerForCharacterTag(characterTag: any): void {
		characterTag.addEventListener('click', ($event) => {
			const tagElement = ($event.target as HTMLElement);
			const beatDataHolder = tagElement.parentNode.parentNode;
			tagElement.remove();
			this.focusBeatByElement(beatDataHolder, false);
		});
		characterTag.addEventListener('mouseover', ($event) => {
			const tagElement = ($event.target as HTMLElement);
			tagElement.style.borderBottomWidth = '2px'
		});
		characterTag.addEventListener('mouseout', ($event) => {
			const tagElement = ($event.target as HTMLElement);
			tagElement.style.borderBottomWidth = '1px'
		});
		characterTag.addEventListener('dragover', ($event) => {
			this.editorSharedService.preventDrag($event);
		});
	}

	private observeCharacterTag(characterTag: HTMLElement) {
		this.onCharacterTagRemoved(characterTag, () => {
			this.removeCharacter(characterTag);
		});
	}

	private onCharacterTagRemoved = function(element, callback) {
		new MutationObserver(function(mutations) {
		  	if(!document.body.contains(element)) {
				callback();
				this.disconnect();
		  	}
		}).observe(element.parentElement as Node, {childList: true});
	}.bind(this);

	private charactersTooltipHideCallback = function() {
		const characterPlaceHolderElement = document.querySelectorAll(`.${this.characterPlaceHolderClass}`);
		characterPlaceHolderElement?.forEach(chaPlaceholder => chaPlaceholder.remove());
		document.removeEventListener('keydown', this.addCharactersTooltipEventHandlersWrapper);
	}.bind(this);

	private addCharactersTooltipEventHandlersWrapper = function($event) {
		this.addCharactersTooltipEventHandlers($event);
	}.bind(this);

	private addCharactersTooltipEventHandlers($event): void {
		console.log('global on characters tooltip');
		const key = $event.which || $event.keyCode || $event.charCode;
		this.cdRef.detectChanges();
		let characters = this.charactersOptionsElements.toArray();
		if (!characters?.length) {
			return;
		}

		const selectedCharacter = document.querySelector<HTMLElement>('.selected-character-option');
		const selectedCharacterIndex: number = selectedCharacter?.dataset?.order
			? +selectedCharacter.dataset.order
			: -1;

		characters?.forEach(characterOpiton => {
			characterOpiton.nativeElement.classList.remove('selected-character-option');
		});

		if (key == 38 || key == 40) {
			if (selectedCharacter) {
				this.characterFilterInputElement?.nativeElement.blur();
			}

			if (key == 38) { // up
				if (selectedCharacterIndex == -1) {
					return;
				}
				if (selectedCharacterIndex == 0) {
					this.characterFilterInputElement.nativeElement.focus();
					return;
				}

				characters[selectedCharacterIndex-1].nativeElement.classList.add('selected-character-option');
				return;

			} else if (key == 40) { // down
				if (!selectedCharacter) {
					characters[0].nativeElement.classList.add('selected-character-option');
					return;
				}

				if (selectedCharacterIndex == characters.length - 1) {
					characters[characters.length - 1].nativeElement.classList.add('selected-character-option');
					return;
				}

				characters[selectedCharacterIndex+1].nativeElement.classList.add('selected-character-option');
				return;
			}
		} if (key == 13) {
			$event.preventDefault();
			selectedCharacter?.click();
			return;
		}
	}

	// #endregion


	// #region tags 

	pickTag(tag: NnaTagWithoutDescriptionDto): void {
		const beatId = this.nnaTooltipService.getTooltipMetadata(this.nnaTooltipService.tagTooltipName).beatId;
		const beatDataHolder = this.nnaTooltipService.getHostingElementFromTooltip(this.nnaTooltipService.tagTooltipName);
		const nnaTagHtmlElement = this.editorSharedService.createNnaTagElement(tag.id, tag.name, beatId);
		this.addEventListenerForNnaTagElements(nnaTagHtmlElement);

		this.syncTagsInBeats.emit({operation: 'attach', data: {id: nnaTagHtmlElement.dataset.id, beatId: beatId, tagId: tag.id }} );
		this.insertNnaTagElementIntoPlaceholder(nnaTagHtmlElement);
		this.nnaTooltipService.hideTooltip(this.nnaTooltipService.tagTooltipName, true);


		const beatIndex = this.beatsIds.indexOf(beatId);
		this.beatsMetaData[beatIndex].isDirty = true;
		this.syncBeats.emit({ source: 'attach_tag_to_beat', metaData: beatIndex });
		this.beatsMetaData[beatIndex].isDirty = false;
		this.focusBeatByElement(beatDataHolder.parentElement);
	}

	removeTag(tag: HTMLElement): void {
		this.syncTagsInBeats.emit({operation: 'detach', data: { id: tag.dataset.id, beatId: tag.dataset.beatId }} );
		tag.remove();

		const beatIndex = this.beatsIds.indexOf(tag.dataset.beatId);
		this.beatsMetaData[beatIndex].isDirty = true;
		this.syncBeats.emit({ source: 'detach_tag_from_beat', metaData: beatIndex });
		this.beatsMetaData[beatIndex].isDirty = false;
	}

	showTagTooltip(hostingElement: any): void {
		hostingElement.appendChild(document.createTextNode('#'));
		this.filtredTags = this.allTags;
		const range = window.getSelection().getRangeAt(0);
		range.collapse(false);
		const tagPlaceHolderElement = document.createElement('span');
		tagPlaceHolderElement.classList.add(this.tagPlaceHolderClass);
		range.insertNode(tagPlaceHolderElement);

		this.nnaTooltipService.addTooltip(
			this.nnaTooltipService.tagTooltipName,
			hostingElement,
			this.tagsTooltipElement.nativeElement,
			{
				arrowNativeElenemt: this.tagTooltipArrowElement.nativeElement,
				placement: 'bottom',
				tooltipMetadata: { beatId: this.editorSharedService.selectBeatIdFromBeatDataHolder(hostingElement) },
				callbackAfterHide: this.tagsTooltipHideCallback,
				offset: { mainAxis: 5, crossAxis: 10 } as TooltipOffsetOptions
			},
			tagPlaceHolderElement
		);

		this.resetTagFilter();

		const previouslySelectedCharacters = document.querySelectorAll<HTMLElement>('.selected-tag-option');
		previouslySelectedCharacters?.forEach(characterOpiton => {
			characterOpiton.classList.remove('selected-tag-option');
		});

		this.nnaTooltipService.showTooltip(this.nnaTooltipService.tagTooltipName);

		setTimeout(() => {
			this.tagFilterInputElement?.nativeElement?.focus();
		}, 200);

		document.addEventListener('keydown', this.addTagsTooltipEventHandlersWrapper);
	}

	filterTags(filterValue: string): void {
		const formedFilterValue = filterValue?.trim()?.toLowerCase();
		if (formedFilterValue == '') {
			this.resetTagFilter();
			return;
		}

		this.filtredTags = this.allTags.filter(tag =>
			tag.name.toLowerCase().includes(this.tagFilterInputElement.nativeElement.value.toLowerCase()));
		}

	private resetTagFilter() {
		this.filtredTags = [...this.allTags];
		if (this.tagFilterInputElement) {
			this.tagFilterInputElement.nativeElement.value = '';
		}
	}


	private tagsTooltipHideCallback = function() {
		const tagPlaceHolderElement = document.querySelectorAll(`.${this.tagPlaceHolderClass}`);
		tagPlaceHolderElement?.forEach(chaPlaceholder => chaPlaceholder.remove());
		document.removeEventListener('keydown', this.addTagsTooltipEventHandlersWrapper);
	}.bind(this);


	private addTagsTooltipEventHandlersWrapper = function($event) {
		this.addTagsTooltipEventHandlers($event);
	}.bind(this);

	private addTagsTooltipEventHandlers($event): void {
		console.log('global on tags tooltip');
		const key = $event.which || $event.keyCode || $event.charCode;
		this.cdRef.detectChanges();
		let tags = this.tagsOptionsElements.toArray();
		if (!tags?.length) {
			return;
		}

		const selectedTag = document.querySelector<HTMLElement>('.selected-tag-option');
		const selectedTagIndex: number = selectedTag?.dataset?.order
			? +selectedTag.dataset.order
			: -1;

		tags?.forEach(tagOption => {
			tagOption.nativeElement.classList.remove('selected-tag-option');
		});

		if (key == 38 || key == 40) {
			if (selectedTag) {
				this.tagFilterInputElement?.nativeElement.blur();
			}

			if (key == 38) { // up
				if (selectedTagIndex == -1) {
					return;
				}
				if (selectedTagIndex == 0) {
					this.tagFilterInputElement.nativeElement.focus();
					return;
				}

				tags[selectedTagIndex-1].nativeElement.classList.add('selected-tag-option');
				return;

			} else if (key == 40) { // down
				if (!selectedTag) {
					tags[0].nativeElement.classList.add('selected-tag-option');
					return;
				}

				if (selectedTagIndex == tags.length - 1) {
					tags[tags.length - 1].nativeElement.classList.add('selected-tag-option');
					return;
				}

				tags[selectedTagIndex+1].nativeElement.classList.add('selected-tag-option');
				return;
			}
		} if (key == 13) {
			$event.preventDefault();
			selectedTag?.click();
			return;
		}
	}

	private addEventListenerForNnaTagElements(nnaTagElement: HTMLElement): void {
		nnaTagElement.addEventListener('click', ($event) => {
			const tagElement = ($event.target as HTMLElement);
			const beatDataHolder = tagElement.parentNode.parentNode;
			tagElement.remove();
			this.focusBeatByElement(beatDataHolder, false);
		});
		nnaTagElement.addEventListener('mouseover', ($event) => {
			const tagElement = ($event.target as HTMLElement);
			tagElement.style.fontStyle = 'italic';
		});
		nnaTagElement.addEventListener('mouseout', ($event) => {
			const tagElement = ($event.target as HTMLElement);
			tagElement.style.fontStyle = 'normal';
		});
		nnaTagElement.addEventListener('dragover', ($event) => {
			this.editorSharedService.preventDrag($event);
		});
	}

	private insertNnaTagElementIntoPlaceholder(nnaTagElement: HTMLElement): void {
		const nnaTagPlaceHolderElement = document.querySelector(`.${this.tagPlaceHolderClass}`);
		nnaTagPlaceHolderElement.parentNode.insertBefore(nnaTagElement, nnaTagPlaceHolderElement);
		this.observeNnaTagElement(nnaTagElement);
	}


	private observeNnaTagElement(nnaTagElement: HTMLElement) {
		this.onNnaTagElementRemoved(nnaTagElement, () => {
			this.removeTag(nnaTagElement);
		});
	}

	private onNnaTagElementRemoved = function(element, callback) {
		new MutationObserver(function(mutations) {
		  	if(!document.body.contains(element)) {
				callback();
				this.disconnect();
		  	}
		}).observe(element.parentElement as Node, {childList: true});
	}.bind(this);


	// #endregion

}
