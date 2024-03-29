import { ElementRef, Injectable, QueryList } from '@angular/core';
import { CachedTagsService } from 'src/app/shared/services/cached-tags.service';
import { NnaTagInBeatDto, NnaTagWithoutDescriptionDto } from '../../layout/models';
import { NnaBeatDto, NnaBeatTimeDto, NnaCharacterInterpolatorPostfix, NnaCharacterInterpolatorPrefix, NnaCharacterTagName, NnaMovieCharacterInBeatDto, NnaTagElementName, NnaTagInterpolatorPostfix, NnaTagInterpolatorPrefix } from '../../layout/dmo-editor/models/dmo-dtos';
import { BeatGeneratorService } from '../../layout/dmo-editor/helpers/beat-generator';
import { NnaHelpersService } from './nna-helpers.service';

@Injectable({
	providedIn: 'root'
})
export class EditorSharedService {

	get defaultTimePickerValue(): string { return '0:00:00'; };
	get defaultEmptyTimePickerValue(): string { return ' :  :  '; }
	get plotPointSyfix(): string { return 'plot_point_'; }


	get plotPointContainerSize(): number { return 32; }
	get defaultBeatMarginBottom(): number{ return 16; }
	get plotPointRadius(): number { return 6; }
	get initialGraphTopMargin(): number {return  16; }
	get plotFlowWidth(): number {return  32; }

	get beatLineHeigth(): number {return  16; }
	get beatContrainerMinHeight(): number {return  32; }


	private tags: NnaTagWithoutDescriptionDto[];

	constructor(
		private beatGeneratorService: BeatGeneratorService, 
		private nnaHelpersService: NnaHelpersService,
		private tagsService: CachedTagsService) { }

	replaceWith(value: string, index: number, replace: string): string {
		return `${value.substr(0, index)}${replace}${value.substr(index + 1)}`;
	}

	getBeatText(beat: NnaBeatDto, includeInnerTags: boolean = false, withStyleAndDataSet: boolean = true): string {
		let decodedBeatText = decodeURIComponent(beat.text);

		let resultedText = (beat.charactersInBeat?.length > 0 || beat.tagsInBeat?.length > 0) && includeInnerTags == true 
			? this.getBeatTextWithNnaCustomTags(beat.charactersInBeat, beat.tagsInBeat, decodedBeatText, beat.beatId, withStyleAndDataSet)
			: decodedBeatText;
		
		return resultedText;
	}

	getBeatTime(time: NnaBeatTimeDto, adjast: boolean) {
		return this.adjastSingleMinutesAndSeconds(this.getTimeView(time, adjast))
	}

	getTimeView(time: NnaBeatTimeDto, adjast: boolean): string {
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

	adjustInvalidMinutesAndSeconds(time: NnaBeatTimeDto): NnaBeatTimeDto {
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

	adjastSingleMinutesAndSeconds(time: string): string {
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


	getBeatTextWithNnaCustomTags(charactersInBeat: NnaMovieCharacterInBeatDto[], tagsInBeat: NnaTagInBeatDto[], interpolatedBeatText: string, beatId: string, withStyleAndDataSet: boolean = true) {
		let textToModify: string = interpolatedBeatText; 

		if (charactersInBeat?.length > 0) {
			charactersInBeat.forEach(characterInBeat => {
				if (textToModify.includes(characterInBeat.id)) {
					let tag = this.createCharacterTag(characterInBeat.characterId, characterInBeat.name, characterInBeat.color, beatId, characterInBeat.id, withStyleAndDataSet);
					textToModify = textToModify.replace(characterInBeat.id, tag.outerHTML);
				}
			});

			textToModify = textToModify.replace(new RegExp(NnaCharacterInterpolatorPrefix, 'g'), '');
			textToModify = textToModify.replace(new RegExp(NnaCharacterInterpolatorPostfix, 'g'), '');
		}

		if (tagsInBeat?.length > 0) {
			tagsInBeat.forEach(tagInBeat => {
				if (textToModify.includes(tagInBeat.id)) {
					let tag = this.createNnaTagElement(tagInBeat.tagId, tagInBeat.name, beatId, tagInBeat.id);
					textToModify = textToModify.replace(tagInBeat.id, tag.outerHTML);
				}
			});

			textToModify = textToModify.replace(new RegExp(NnaTagInterpolatorPrefix, 'g'), '');
			textToModify = textToModify.replace(new RegExp(NnaTagInterpolatorPostfix, 'g'), '');
		}

		return textToModify;
	}

	createCharacterTag(charterId: string, characterName: string, color: string, beatId: string, id: string = null, withStyleAndDataSet: boolean = true): HTMLElement {
		let characterElem = document.createElement(NnaCharacterTagName);
		if (withStyleAndDataSet === true) {
			characterElem.style.cursor = 'pointer';
			characterElem.style.paddingLeft = '1px';
			characterElem.style.paddingRight = '1px';
			characterElem.style.userSelect = 'auto';
			characterElem.style.borderBottomColor = color;
			characterElem.style.borderBottomWidth = '1px';
			characterElem.style.borderBottomStyle = 'solid';
			characterElem.dataset.characterId = charterId;
			characterElem.dataset.id = id == null ? this.beatGeneratorService.generateTempId() : id;
			characterElem.dataset.beatId = beatId;
			characterElem.setAttribute('contenteditable', "false");
			characterElem.setAttribute('draggable', "false");
		}

		const capitilizedName = characterName.charAt(0).toUpperCase() + characterName.slice(1);
		characterElem.innerText = '@' + capitilizedName;
		return characterElem;
	}

	createNnaTagElement(tagId: string, tagName: string, beatId: string, id: string = null): HTMLElement {
		let tagElement = document.createElement(NnaTagElementName);
		tagElement.style.cursor = 'pointer';
		tagElement.style.userSelect = 'auto';
		tagElement.style.fontWeight = '700';
		tagElement.style.fontSize = '1.1rem';
		tagElement.dataset.tagId = tagId;
		tagElement.dataset.id = id == null ? this.beatGeneratorService.generateTempId() : id;
		tagElement.dataset.beatId = beatId;
		tagElement.setAttribute('contenteditable', "false");
		tagElement.setAttribute('draggable', "false");

		tagElement.innerText = '#' + tagName;

		return tagElement;
	}
	
	isDiv(element: any): boolean {
		return element.nodeName == "DIV"
	}

	selectBeatIdFromBeatDataHolder(nativeElement: any): string {
		let beatSufix = 'beat_';
		return nativeElement.getAttribute('id')?.substring(beatSufix.length) ?? '';
	}

	selectBeatIdFromTimePicker(nativeElement: any): string {
		let beatSufix = 'time_picker_';
		return nativeElement.getAttribute('id')?.substring(beatSufix.length) ?? '';
	}
  
	convertTimeToDto(value: string): NnaBeatTimeDto {
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
	
	selectCharactersFromBeatElement(beatElement: HTMLElement): NnaMovieCharacterInBeatDto[] {
		let characters: NnaMovieCharacterInBeatDto[] = [];
		beatElement.childNodes?.forEach((childNode: HTMLElement) => {
			if (childNode.nodeName.toLowerCase() == NnaCharacterTagName.toLowerCase()) {
				characters.push({
					id: childNode.dataset.id, 
					characterId: childNode.dataset.characterId, 
					name: childNode.nodeValue, 
					color: childNode.style.borderBottomColor 
				} as NnaMovieCharacterInBeatDto )
			}
		});
		return characters;
	}

	selectTagsFromBeatElement(beatElement: HTMLElement): NnaTagInBeatDto[] {
		let tags: NnaTagInBeatDto[] = [];
		beatElement.childNodes?.forEach((childNode: HTMLElement) => {
			if (childNode.nodeName.toLowerCase() == NnaTagElementName.toLowerCase()) {
				tags.push({
					id: childNode.dataset.id, 
					name: childNode.nodeValue,
					tagId: childNode.dataset.tagId
				} as NnaTagInBeatDto )
			}
		});
		return tags;
	}

	getBeatTextWithInterpolatedNnaCustomTags(beatElement: HTMLElement): string {
		let beatCopy = beatElement.cloneNode(true) as HTMLElement;
		beatCopy.childNodes?.forEach((childNode: HTMLElement) => {
			if (childNode.nodeName.toLowerCase() == NnaCharacterTagName.toLowerCase()) {
				const characterInBeatId = childNode.dataset.id;
				const interpolatedCharacterTag = document.createTextNode(NnaCharacterInterpolatorPrefix + characterInBeatId + NnaCharacterInterpolatorPostfix);
				childNode.parentElement.insertBefore(interpolatedCharacterTag, childNode);
				childNode.remove();
			} else if (childNode.nodeName.toLowerCase() == NnaTagElementName.toLocaleLowerCase()) {
				const tagInBeatId = childNode.dataset.id;
				const interpolatedNnaTag = document.createTextNode(NnaTagInterpolatorPrefix + tagInBeatId + NnaTagInterpolatorPostfix);
				childNode.parentElement.insertBefore(interpolatedNnaTag, childNode);
				childNode.remove();
			}
		});

		return beatCopy.innerHTML;
	}

	selectCharacterTagsFromText(input: string): HTMLElement[] {
		const parser = new DOMParser();
		const doc = parser.parseFromString(input, 'text/html');
		return Array.from(doc.getElementsByTagName(NnaCharacterTagName)) as HTMLElement[];
	}

	overrideCharacterTagStyles(rowBeatText: string, newStyles: any[]): string {
		const characterTags = this.selectCharacterTagsFromText(rowBeatText);
		characterTags.forEach(characterTag => {
			const oldTag = characterTag.outerHTML;
			newStyles.forEach(newStyle => {
				characterTag.style[newStyle.name] = newStyle.value;
			});

			rowBeatText = rowBeatText.replace(oldTag, characterTag.outerHTML);
		});

		return rowBeatText;
	}



	selectBeatId(plotPointElement: any): string {
		return plotPointElement.getAttribute('id').substring(this.plotPointSyfix.length);
	}

	calculateGraphHeigth(plotPoints: any[], isDmoFinished: boolean): string {
		let heigth: number = 0;
		let allLines: number = 0;
		
		plotPoints.forEach((pp, i) => {
			allLines += pp.plotPointMetaData.lines;
			if (plotPoints.length != i+1) {
				heigth += (this.plotPointContainerSize * pp.plotPointMetaData.lineCount);
				heigth += this.defaultBeatMarginBottom;

				if (pp.plotPointMetaData.lines % 2 != 0 && pp.plotPointMetaData.lines > 2) {
					heigth -= this.defaultBeatMarginBottom;
				}

			} else {
				heigth += this.plotPointContainerSize;
			}
		});

		heigth += this.initialGraphTopMargin;
	
		if (isDmoFinished == true) {
			let latsPlotPoint = plotPoints[plotPoints.length - 1].plotPointMetaData;
			heigth += (latsPlotPoint.lineCount * this.plotPointContainerSize);
			heigth += this.initialGraphTopMargin;

			if (latsPlotPoint.lines % 2 != 0 && latsPlotPoint.lines > 2) {
				heigth -= this.defaultBeatMarginBottom;
			}
		}

		heigth += (2 * plotPoints.length);

		return heigth.toString();
	}

	getSvgCanvas(): string {
		return `0 0 ${this.plotPointContainerSize} ${this.plotPointContainerSize}`;
	}
	
	preventDrag($event: any): void {
		$event.dataTransfer.dropEffect = 'none';
		$event.preventDefault();
	}

	scrollToElement(element: any): void {
		element.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
	}

	calculateLineCount(nativeElement: any): any {
		let spanHeight = nativeElement.offsetHeight;
		let lines = Math.ceil(spanHeight / this.beatLineHeigth);

		return lines <= 1
			? { lineCount: 1, lines: lines }
			: { lineCount: lines % 2 == 0 ? (lines / 2) : Math.floor(lines / 2) + 1, lines: lines};
	}

	shiftCursorToTheEndOfChildren(dataHolderContainer: any, scrollToElement: boolean = true): void {
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

	setBeatSelection(lastChildElement: HTMLElement | Node): void {
		const range = document.createRange();
		range.setStart(lastChildElement, lastChildElement.textContent.length);
		range.collapse(true);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}

	setCharactersClaims(): void {
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

	selectCharacterIdFromTag(characterElement: HTMLElement): string {
		return characterElement.dataset.characterId;
	}

	selectBeatDtos(beatElements: QueryList<ElementRef>, timePickersElements: QueryList<ElementRef>): NnaBeatDto[] {
		return beatElements.map((beatElement, i) => {
				return this.selectSingleBeatForClient(beatElement.nativeElement, i, timePickersElements);
		});
	}

	selectSingleBeatForClient(beatElement: HTMLElement, index: number, timePickersElements: QueryList<ElementRef>): NnaBeatDto  {
		const beatId = this.selectBeatIdFromBeatDataHolder(beatElement);
		const beat: NnaBeatDto = {
			beatId: beatId,
			order: index,
			text: encodeURIComponent(beatElement.innerHTML),
			time: this.buildTimeDtoFromBeat(beatId, timePickersElements),
			type: +beatElement.dataset.beatType,
			charactersInBeat: this.selectCharactersFromBeatElement(beatElement),
			tagsInBeat: this.selectTagsFromBeatElement(beatElement)
		}

		return beat;
	}


	buildTimeDtoFromBeat(beatId: string, timePickerElements: QueryList<ElementRef>): NnaBeatTimeDto {
		let selectedTimePickerElement: any;
		timePickerElements.forEach(timePicker => {
			if (this.selectBeatIdFromTimePicker(timePicker.nativeElement) == beatId) {
				selectedTimePickerElement = timePicker.nativeElement;
				return;
			}
		});
		
		return this.convertTimeToDto(selectedTimePickerElement.value);
	}

	orderBeats(beats: NnaBeatDto[]): NnaBeatDto[] {
		let shouldIncrement: boolean = false;
		beats.forEach((beat, i) => {
			if (beat.order == -1) {
				beat.order = i - 1;
				shouldIncrement = true;
			} else {
				beat.order = i;
			}
			if (shouldIncrement) {
				beat.order = beat.order + 1;
			}
		});

		return beats;
	}

	selectSingleBeatForServer(index: number, beatElements: QueryList<ElementRef>, timePickersElements: QueryList<ElementRef>): NnaBeatDto {
		const beatElement = beatElements.toArray()[index].nativeElement;
		const beatId = this.selectBeatIdFromBeatDataHolder(beatElement);
		const beat : NnaBeatDto = {
			beatId: beatId,
			order: index,
			text: encodeURIComponent(this.getBeatTextWithInterpolatedNnaCustomTags(beatElement)),
			time: this.buildTimeDtoFromBeat(beatId, timePickersElements),
			type: beatElement.dataset.beatType,
			charactersInBeat: this.selectCharactersFromBeatElement(beatElement),
			tagsInBeat: this.selectTagsFromBeatElement(beatElement)
		}

		return beat;
	}

}
