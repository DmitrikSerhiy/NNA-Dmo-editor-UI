import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { EditorSharedService } from 'src/app/layout/dmo-editor/helpers/editor-shared.service';
import { NnaBeatDto, NnaCharacterTagName, NnaMovieCharacterInDmoDto, NnaTagElementName } from 'src/app/layout/dmo-editor/models/dmo-dtos';
import { CachedTagsService } from 'src/app/shared/services/cached-tags.service';
import { NnaHelpersService } from 'src/app/shared/services/nna-helpers.service';
import { NnaTooltipService } from 'src/app/shared/services/nna-tooltip.service';

@Component({
	selector: 'app-beats-flow-readonly',
	templateUrl: './beats-flow-readonly.component.html',
	styleUrls: ['./beats-flow-readonly.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BeatsFlowReadonlyComponent implements AfterViewInit {
	
	@Input() initialBeats: NnaBeatDto[];
	@Input() initialCharacters: NnaMovieCharacterInDmoDto[];
	@Input() isDmoFinished: boolean;

	@Output() beatsSet: EventEmitter<any> = new EventEmitter<any>();


	isDataLoaded: boolean = false;
	beats: NnaBeatDto[];
	characters: NnaMovieCharacterInDmoDto[];

	private beatsIds: string[] = [];
	private beatsMetaData: any[] = [];

	private beatLineHeigth: number = 16;
	private beatContrainerMinHeight: number = 32;


	@ViewChildren('timePickers') timePickersElements: QueryList<ElementRef>;
	@ViewChildren('beatDataHolders') beatDataHolderElements: QueryList<ElementRef>;

	constructor(
		private cdRef: ChangeDetectorRef,
		private nnaTooltipService: NnaTooltipService,
		private editorSharedService: EditorSharedService,
		private nnaHelpersService: NnaHelpersService,
		private tagsService: CachedTagsService) { }


	ngAfterViewInit(): void {
		this.beats = this.initialBeats;
		this.characters = this.initialCharacters;
		this.isDataLoaded = true;

		this.setupBeats();
		this.setupEditorCallback();
	}


	private setupBeats(): void {
		this.cdRef.detectChanges();
		this.setupTimePickerValues();
		this.setupBeatDataHolderValuesAndMetaData();
		this.setupLastBeatMargin();
		this.cdRef.detectChanges();
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


	prepareTimePicker(): void {
		this.nnaTooltipService.hideAllTooltips();
	}

	prepareBeatDataHolder($event: any): void {
		this.nnaTooltipService.hideAllTooltips();
	}

	beatContainerClick($event: any): void {
		if ($event.target.className == 'beat-data-holder-container') {
			$event.target.children[0].focus();
			this.shiftCursorToTheEndOfChildren($event.target);
		}
	}

	preventDrag($event: any): void {
		$event.dataTransfer.dropEffect = 'none';
		$event.preventDefault();
	}

	preventInput($event: any): void {
		$event.preventDefault();
	}

    // #region beat data holders (helpers)

	private setupLastBeatMargin(): void {
		this.beatDataHolderElements.last.nativeElement.parentNode.style.marginBottom = '0px';
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
			let beat = this.beats.find(b => b.beatId == this.editorSharedService.selectBeatIdFromBeatDataHolder(beatDataHolder.nativeElement));
			if (!beat) {
				return;
			}

			beatDataHolder.nativeElement.innerHTML = this.editorSharedService.getBeatText(beat, true, true);
			beatDataHolder.nativeElement.dataset.beatType = beat.type;
			this.beatsMetaData.push(this.calculateLineCount(beatDataHolder.nativeElement));
			this.beatsIds.push(beat.beatId);
		});

		let characterTags = document.querySelectorAll<HTMLElement>(NnaCharacterTagName);
		if (characterTags?.length > 0) {
			this.setCharactersClaims();
			characterTags.forEach(characterTag => {
				this.addEventListenerForCharacterTag(characterTag);
			});
		}

		let nnaTagElements = document.querySelectorAll<HTMLElement>(NnaTagElementName);
		if (nnaTagElements?.length > 0) {
			nnaTagElements.forEach(tagElement => {
				this.addEventListenerForNnaTagElements(tagElement);
			});
		}
	}

	private shiftCursorToTheEndOfChildren(dataHolderContainer: any, scrollToElement: boolean = true): void {
		if (!dataHolderContainer.children) {
			return;
		}

		const dataHolder = dataHolderContainer.lastChild as HTMLElement;
		const lastChild = dataHolder.lastChild as HTMLElement;

		if (!lastChild) {
			dataHolder.focus();
			if (scrollToElement == true) {
				this.scrollToElement(dataHolder);
			}
			return;
		} else {
			if (lastChild.nodeType == 3) { // TEXT_NODE
				this.setBeatSelection(lastChild);
				if (scrollToElement == true) {
					this.scrollToElement(dataHolder);
				}
			} else { // any other element
				if (lastChild.nodeName.toLowerCase() == NnaCharacterTagName.toLowerCase()) {
					const emptyElement = document.createTextNode(' ') as Node;
					lastChild.after(emptyElement);
					this.setBeatSelection(emptyElement);
					if (scrollToElement == true) {
						this.scrollToElement(dataHolder);
					}
					return
				}
				lastChild.focus();
				if (scrollToElement == true) {
					this.scrollToElement(lastChild);
				}
			}
		}
	}

	private setBeatSelection(lastChildElement: HTMLElement | Node): void {
		const range = document.createRange();
		range.setStart(lastChildElement, lastChildElement.textContent.length);
		range.collapse(true);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}

    // #endregion


  	// #region time picker (helpers)


	private focusTimePicker(nativeElement: any): void {
		nativeElement.focus();
		this.scrollToElement(nativeElement);
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


	private focusBeatByElement(nativeEnement: any, scrollToBeat: boolean = false): void {
		this.shiftCursorToTheEndOfChildren(nativeEnement, scrollToBeat);
	}

  	// #endregion


	onOpenCharactersPopup($event: any) {
		// this.openCharactersPopup.emit({action: $event});
	}

	private addEventListenerForCharacterTag(characterTag: any): void {
		characterTag.addEventListener('click', ($event) => {
			// const tagElement = ($event.target as HTMLElement);
			// const beatDataHolder = tagElement.parentNode.parentNode;
			// tagElement.remove();
			// this.focusBeatByElement(beatDataHolder, false);
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
			this.preventDrag($event);
		});
	}

	private setCharactersClaims(): void {
		let characterTags = document.querySelectorAll<HTMLElement>(NnaCharacterTagName);
		if (!characterTags?.length) {
			return;
		}

		if (!characterTags?.length) {
			return;
		}

		let grouppedCharacterTags = this.nnaHelpersService.groupBy(Array.from(characterTags), this.selectCharacterIdFromTag);
		if (!grouppedCharacterTags) {
			return;
		}

		for (const group in grouppedCharacterTags) {
			grouppedCharacterTags[group].forEach((characterTag, i) => {
				if (i == 0) {
					characterTag.innerHTML = characterTag.innerHTML.toUpperCase();
				}
			});
		}
	}

	private selectCharacterIdFromTag(characterElement: HTMLElement): string {
		return characterElement.dataset.characterId;
	}

	private addEventListenerForNnaTagElements(nnaTagElement: HTMLElement): void {
		nnaTagElement.addEventListener('click', ($event) => {
			// const tagElement = ($event.target as HTMLElement);
			// const beatDataHolder = tagElement.parentNode.parentNode;
			// tagElement.remove();
			// this.focusBeatByElement(beatDataHolder, false);
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
			this.preventDrag($event);
		});
	}
}