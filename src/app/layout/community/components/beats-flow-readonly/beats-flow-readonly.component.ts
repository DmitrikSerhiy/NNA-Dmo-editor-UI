import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditorSharedService } from 'src/app/shared/services/editor-shared.service';
import { NnaBeatDto, NnaCharacterTagName, NnaMovieCharacterInDmoDto, NnaTagElementName } from 'src/app/layout/dmo-editor/models/dmo-dtos';
import { TagDescriptionPopupComponent } from 'src/app/layout/tags/tag-description-popup/tag-description-popup.component';
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
	@Output() openCharactersPopup: EventEmitter<any> = new EventEmitter<any>();

	isDataLoaded: boolean = false;
	beats: NnaBeatDto[];
	characters: NnaMovieCharacterInDmoDto[];

	private beatsIds: string[] = [];
	private beatsMetaData: any[] = [];

	@ViewChildren('timePickers') timePickersElements: QueryList<ElementRef>;
	@ViewChildren('beatDataHolders') beatDataHolderElements: QueryList<ElementRef>;

	constructor(
		private cdRef: ChangeDetectorRef,
		private nnaTooltipService: NnaTooltipService,
		public editorSharedService: EditorSharedService,
		private matModule: MatDialog) { }


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

	prepareTimePicker(): void {
		this.nnaTooltipService.hideAllTooltips();
	}

	prepareBeatDataHolder($event: any): void {
		this.nnaTooltipService.hideAllTooltips();
	}

	beatContainerClick($event: any): void {
		if ($event.target.className == 'beat-data-holder-container') {
			$event.target.children[0].focus();
			this.editorSharedService.shiftCursorToTheEndOfChildren($event.target);
		}
	}

	preventInput($event: any): void {
		$event.preventDefault();
	}

	private setupLastBeatMargin(): void {
		this.beatDataHolderElements.last.nativeElement.parentNode.style.marginBottom = '0px';
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
			this.beatsMetaData.push(this.editorSharedService.calculateLineCount(beatDataHolder.nativeElement));
			this.beatsIds.push(beat.beatId);
		});

		let characterTags = document.querySelectorAll<HTMLElement>(NnaCharacterTagName);
		if (characterTags?.length > 0) {
			this.editorSharedService.setCharactersClaims();
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

	private addEventListenerForCharacterTag(characterTag: any): void {
		characterTag.addEventListener('click', ($event) => {
			const tagElement = ($event.target as HTMLElement);
			const characterId = tagElement.dataset.characterId;
			this.openCharactersPopup.emit({action: 'view_character', characterId: characterId });
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


	private addEventListenerForNnaTagElements(nnaTagElement: HTMLElement): void {
		nnaTagElement.addEventListener('click', async ($event) => {
			const tagElement = ($event.target as HTMLElement);
			const tagId = tagElement.dataset.tagId;

			await this.matModule
				.open(TagDescriptionPopupComponent, { data: tagId, width: '400px' })
				.afterClosed()
				.toPromise();
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
}