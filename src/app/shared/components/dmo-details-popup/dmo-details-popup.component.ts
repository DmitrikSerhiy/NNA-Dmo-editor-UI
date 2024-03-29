import { Component, ElementRef, HostListener, Inject, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DmoCharactersForConflictDto, DmoConflictDto, DmoDetailsDto, UpdateDmoDetailsDto, UpdateDmoPlotDetailsDto  } from 'src/app/layout/models';
import { EditorHub } from '../../../layout/dmo-editor/services/editor-hub.service';
import { compare } from 'fast-json-patch';
import { MatSelectChange } from '@angular/material/select';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { NnaHelpersService } from 'src/app/shared/services/nna-helpers.service';


@Component({
	selector: 'app-dmo-details-popup',
	templateUrl: './dmo-details-popup.component.html',
	styleUrls: ['./dmo-details-popup.component.scss']
})
export class DmoDetailsPopupComponent implements OnInit {

	dmoDetailsForm: FormGroup;
	dmoPlotDetailsForm: FormGroup;
	dmoConflictForm: FormGroup;
	currentTabIndex: number = 0;
	helpWindow: boolean = false;
	private maxEntityNameLength = 100;
	private maxLongEntityLength = 500;
	
	private dmoDetails: DmoDetailsDto;
	private dmoId: string; 
	dmoIsLoaded: boolean = false;
	showPremiseQuestionMark: boolean = false;
	initialControllingIdeaType: number = 0;
	conflictPairs: any[];

	get readonly(): boolean { return this._readonly; }
	private set readonly(value: boolean) { this._readonly = value; }
	private _readonly: boolean;

	get dmoName() { return this.dmoDetailsForm.get('dmoNameInput'); }
	get movieTitle() { return this.dmoDetailsForm.get('movieTitleInput'); }
	get dmoStatus() { return this.dmoDetailsForm.get('dmoStatusInput'); }
	get shortComment() { return this.dmoDetailsForm.get('shortCommentInput'); }

	get premise() { return this.dmoPlotDetailsForm.get('premiseInput'); }
	get controllingIdea() { return this.dmoPlotDetailsForm.get('controllingIdeaInput'); }
	get controllingIdeaType() { return this.dmoPlotDetailsForm.get('controllingIdeaTypeRadio'); }
	get didacticism() { return this.dmoPlotDetailsForm.get('didacticismCheckbox'); }
	get didacticismDescription() { return this.dmoPlotDetailsForm.get('didacticismInput'); }


	@ViewChildren('conflictDescription') conflictDescriptionElements: QueryList<ElementRef>;
	@ViewChildren('conflictCheckbox') conflictCheckboxElements: QueryList<MatCheckbox>;
	@ViewChildren('conflictCheckboxContainer') conflictCheckboxContainerElements: QueryList<ElementRef>;


	private maxNameLengthExceededValidationMessage: string;
	private maxMovieTitleLengthExceededValidationMessage: string;
	private maxShortCommentLengthExceededValidationMessage: string;
	private movieTitleMissingValidationMessage: string;

	private maxPremiseLengthExceededValidationMessage: string;
	private maxControllingIdeaLengthExceededValidationMessage: string;
	private maxDidacticismDescriptionLengthExceededValidationMessage: string;

	dmoDetailsValidations: string[] = [];
	dmoPlotDetailsValidations: string[] = [];
	conflictFormValidations: string[] = [];


	updatedTab: string[] = [];

	@HostListener('window:keydown', ['$event'])
	handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			this.onClose();
		}
	}

	constructor(
		private dialogRef: MatDialogRef<DmoDetailsPopupComponent>,
		private nnaHelpersService: NnaHelpersService,
		private editorHub: EditorHub,
		@Inject(MAT_DIALOG_DATA) private data: any) {
			this.dmoId = data.dmoId;
			this.readonly = data.readonly;

			this.maxNameLengthExceededValidationMessage = "Maximum name length exceeded";
			this.maxMovieTitleLengthExceededValidationMessage = "Maximum movie title length exceeded";
			this.maxShortCommentLengthExceededValidationMessage = "Maximum short comment length exceeded";
			this.movieTitleMissingValidationMessage = "Movie title is missing";

			this.maxPremiseLengthExceededValidationMessage = "Maximum premise length exceeded";
			this.maxControllingIdeaLengthExceededValidationMessage = "Maximum controlling idea length exceeded";
			this.maxDidacticismDescriptionLengthExceededValidationMessage = "Maximum didacticism description length exceeded";
		}


	async ngOnInit(): Promise<void> {
		this.dmoDetails = await this.editorHub.getDmoDetails(this.dmoId);
		this.dmoIsLoaded = true;
		this.dialogRef.backdropClick().subscribe(() => this.onClose());
		this.dmoDetailsForm = new FormGroup({
			'dmoNameInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxEntityNameLength)]),
			'movieTitleInput': new FormControl({value: '', disabled: this.readonly}, [Validators.required, Validators.maxLength(this.maxEntityNameLength)]),
			'dmoStatusInput': new FormControl({value: '', disabled: this.readonly}),
			'shortCommentInput': new FormControl({value: '', disabled: this.readonly},  [Validators.maxLength(this.maxLongEntityLength)])
		});

		this.dmoPlotDetailsForm = new FormGroup({
			'premiseInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxLongEntityLength)]),
			'controllingIdeaInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxLongEntityLength)]),
			'controllingIdeaTypeRadio': new FormControl({value: '', disabled: this.readonly}),
			'didacticismCheckbox': new FormControl({value: '', disabled: this.readonly}),
			'didacticismInput': new FormControl({value: '', disabled: this.readonly},  [Validators.maxLength(this.maxLongEntityLength)])	
		});

		this.dmoConflictForm = new FormGroup({});

		this.setDmoDetailsValues();
	}

	async saveDmoDetails(shouldSave: boolean): Promise<void> {
		if (this.readonly) {
			return;
		}
		if (this.currentTabIndex !== 0) {
			return;
		}

		if (shouldSave === false) {
			this.resetDmoDetailsForm();
			this.setDmoDetailsValues();
			return;
		}

		if (!this.dmoDetailsForm.valid) {
			this.dmoDetailsValidations = [];
			if (this.movieTitle.errors != null && this.movieTitle.errors.maxlength) {
				this.dmoDetailsValidations.push(this.maxMovieTitleLengthExceededValidationMessage);
			}

			if (this.movieTitle.errors != null && this.movieTitle.errors.required) {
				this.dmoDetailsValidations.push(this.movieTitleMissingValidationMessage);
			}

			if (this.dmoName.errors != null && this.dmoName.errors.maxlength) {
				this.dmoDetailsValidations.push(this.maxNameLengthExceededValidationMessage);
			}

			if (this.shortComment.errors != null && this.shortComment.errors.maxlength) {
				this.dmoDetailsValidations.push(this.maxShortCommentLengthExceededValidationMessage);
			}

			return;
		}

		const update = {
			movieTitle: this.nnaHelpersService.sanitizeSpaces(this.movieTitle.value),
			name: this.nnaHelpersService.sanitizeSpaces(this.dmoName.value),
			dmoStatusId: this.dmoStatus.value,
			shortComment: this.nnaHelpersService.sanitizeSpaces(this.shortComment.value)
		} as UpdateDmoDetailsDto;

		const oldValue = {
			movieTitle: this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.movieTitle),
			name: this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.name),
			dmoStatusId: this.dmoDetails.dmoStatusId,
			shortComment: this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.shortComment)
		} as UpdateDmoDetailsDto;

		const patch = compare(oldValue, update);
		if (!patch?.length) {
			this.resetDmoDetailsForm();
			this.setDmoDetailsValues();
			return;
		}

		await this.editorHub.updateDmoDetails(this.dmoId, patch);

		this.updatedTab.push('details');
		this.updateDmoDetailsInitialValues();
		this.resetDmoDetailsForm();
		this.setDmoDetailsValues();
		
	}

	async savePlotChanges(shouldSave: boolean): Promise<void> {
		if (this.readonly) {
			return;
		}
		if (this.currentTabIndex !== 1) {
			return;
		}
		
		if (shouldSave === false) {
			this.resetDmoPlotDetailsForm();
			this.setDmoPlotDetailsValues();
			return;
		}

		if (!this.dmoPlotDetailsForm.valid) {
			this.dmoPlotDetailsValidations = [];
			
			if (this.premise.errors != null && this.premise.errors.maxlength) {
				this.dmoPlotDetailsValidations.push(this.maxPremiseLengthExceededValidationMessage);
			}

			if (this.controllingIdea.errors != null && this.controllingIdea.errors.maxlength) {
				this.dmoPlotDetailsValidations.push(this.maxControllingIdeaLengthExceededValidationMessage);
			}

			if (this.didacticismDescription.errors != null && this.didacticismDescription.errors.maxlength) {
				this.dmoPlotDetailsValidations.push(this.maxDidacticismDescriptionLengthExceededValidationMessage);
			}

			return;
		}
		

		const update = {
			premise: this.nnaHelpersService.sanitizeSpaces(this.premise.value),
			controllingIdea: this.nnaHelpersService.sanitizeSpaces(this.controllingIdea.value),
			didacticismDescription: this.nnaHelpersService.sanitizeSpaces(this.didacticismDescription.value),
			didacticism: this.didacticism.value,
			controllingIdeaId: this.controllingIdeaType.value
		} as UpdateDmoPlotDetailsDto;

		const oldValue = {
			premise: this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.premise),
			controllingIdea: this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.controllingIdea),
			didacticismDescription: this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.didacticismDescription),
			didacticism: this.dmoDetails.didacticism,
			controllingIdeaId: this.dmoDetails.controllingIdeaId
		} as UpdateDmoPlotDetailsDto;

		const patch = compare(oldValue, update);
		if (!patch?.length) {
			this.resetDmoPlotDetailsForm();
			this.setDmoPlotDetailsValues();
			return;
		}

		await this.editorHub.updateDmoPlotDetails(this.dmoId, patch);

		this.updatedTab.push('plot');
		this.updateDmoPlotDetailsInitialValues();
		this.resetDmoPlotDetailsForm();
		this.setDmoPlotDetailsValues();
	}

	toggleHelp(open: boolean) {
		if (open == true) {
			this.helpWindow = true;
		} else {
			this.helpWindow = false;
		}
	}

	onClose() {
		this.resetDmoDetailsForm();
		this.resetDmoPlotDetailsForm();
		this.resetConflictForm();

		if (this.readonly) {
			this.updatedTab = [];
		}

		this.dialogRef.close({
			cancelled: false,
			tabs: this.updatedTab
		});
		this.updatedTab = [];
	}

	swipeTab($event: number): void {
		this.helpWindow = false;
		this.currentTabIndex = $event;

		if (this.currentTabIndex === 0) {
			this.resetDmoPlotDetailsForm();
			this.resetConflictForm();
			this.setDmoDetailsValues();
		}
		if (this.currentTabIndex === 1) {
			this.resetConflictForm();
			this.resetDmoDetailsForm();
			this.setDmoPlotDetailsValues();
		}
		if (this.currentTabIndex === 2) {
			this.resetDmoPlotDetailsForm();
			this.resetDmoDetailsForm();
			this.setConflictValues();
		}
	} 

	setControllingIdeaType(): void {
		if (this.readonly) {
			return;
		}
		this.controllingIdea.value
			? this.controllingIdeaType.setValue(this.controllingIdeaType.value) 
			: this.controllingIdeaType.setValue(this.initialControllingIdeaType);
	}

	setDidacticismDescription(): void {
		if (this.readonly) {
			return;
		}
		if (!this.didacticism.value) {
			this.didacticismDescription.setValue('');
		}
	}

	async selectCharacter($event: MatSelectChange, uniqueId: string): Promise<void> {
		if (this.readonly) {
			return;
		}
		if (!$event.value) { // if no value was selected
			this.dmoConflictForm.get(uniqueId + '-select').setValue('');
			this.dmoConflictForm.get(uniqueId + '-checkbox').setValue(false);
			this.clearConflictCharacterGoalDescriptionValue(uniqueId);
			this.resetConflictCheckbox(uniqueId);
			this.dmoConflictForm.markAsDirty();

			
			let conglictDto = this.getDmoConflictFromControlName(uniqueId.split('-select')[0]);
			let previousConflictDto = this.dmoDetails.conflicts.find(c => c.id == conglictDto.id);
			conglictDto.characterId = '';
			conglictDto.achieved = false;
			let patch = compare(previousConflictDto, conglictDto);
			if (!patch?.length) {
				return;
			}

			await this.editorHub.patchConflict(conglictDto.id, patch);
			this.updateDmoconflictInitialValues(conglictDto);
			return;
		}

		const previouslySelectedCharacter = this.dmoConflictForm.get(uniqueId + '-select').value;
		if (previouslySelectedCharacter) {
			if ($event.value == previouslySelectedCharacter) {
				return;
			} else {
				this.resetConflictCheckbox(uniqueId);
				this.dmoConflictForm.get(uniqueId + '-checkbox').setValue(false);
			}
		}

		const character = this.dmoDetails.charactersForConflict.find(character => character.characterId == $event.value)
		if (!character) {
			return;	
		}

		this.setColorOnSelectPick(uniqueId, character.color);
		this.dmoConflictForm.get(uniqueId + '-select').setValue($event.value);
		this.dmoConflictForm.markAsDirty();

		let descriptionElement = this.conflictDescriptionElements
			.toArray()
			.filter(conflictDescriptionElement => conflictDescriptionElement.nativeElement.getAttribute('id') == uniqueId + '-description')[0].nativeElement;
		this.setConflictCharacterGoalDescriptionValue(character, descriptionElement);

		let checkboxContainer = this.conflictCheckboxContainerElements
			.toArray()
			.filter(conflictCheckboxContainerElement => conflictCheckboxContainerElement.nativeElement.id == (uniqueId + '-checkbox-container') )[0].nativeElement;
		checkboxContainer.style.display = 'block';


		let conglictDto =  this.getDmoConflictFromControlName(uniqueId.split('-select')[0]);
		let previousConflictDto = this.dmoDetails.conflicts.find(c => c.id == conglictDto.id);
		conglictDto.characterId = $event.value;
		conglictDto.achieved = previousConflictDto.achieved;
		let patch = compare(previousConflictDto, conglictDto);
		if (!patch?.length) {
			return;
		}

		await this.editorHub.patchConflict(conglictDto.id, patch);
		this.updateDmoconflictInitialValues(conglictDto);
	}

	async changeGoalAchieved($event: MatCheckboxChange, contronId: string): Promise<void> {
		if (this.readonly) {
			return;
		}
		this.dmoConflictForm.markAsDirty();
		this.dmoConflictForm.get(contronId + '-checkbox').setValue($event.checked);

		let conglictDto =  this.getDmoConflictFromControlName(contronId.split('-checkbox')[0]);
		let previousConflictDto = this.dmoDetails.conflicts.find(c => c.id == conglictDto.id);

		conglictDto.achieved = $event.checked;
		conglictDto.characterId = previousConflictDto.characterId;
		let patch = compare(previousConflictDto, conglictDto);
		if (!patch?.length) {
			return;
		}

		await this.editorHub.patchConflict(conglictDto.id, patch);
		this.updateDmoconflictInitialValues(conglictDto);
	}

	getUniqueControlIdForConflictForm(order: number, characterType: number, dto: DmoConflictDto): string {
		return dto.pairId + '--' + order + '--' + dto.id + '--' + characterType;
	}

	async addConflict() {
		if (this.readonly) {
			return;
		}
		if (!this.conflictPairs?.length) {
			this.conflictPairs = [];
		}

		let newConflict = await this.editorHub.createConflict(this.dmoId);
		let newConflictPair: any = {
			protagonist: newConflict.protagonist,
			antagonist: newConflict.antagonist,
			order: this.conflictPairs.length,
			pairId: newConflict.protagonist.pairId
		};

		let protagonistControlName = this.getUniqueControlIdForConflictForm(this.conflictPairs.length, 1, newConflict.protagonist);
		let antagonistControlName = this.getUniqueControlIdForConflictForm(this.conflictPairs.length, 2, newConflict.antagonist);

		this.dmoConflictForm.addControl(protagonistControlName + '-select', new FormControl());
		this.dmoConflictForm.addControl(protagonistControlName + '-checkbox', new FormControl());
		
		this.dmoConflictForm.addControl(antagonistControlName + '-select', new FormControl());
		this.dmoConflictForm.addControl(antagonistControlName + '-checkbox', new FormControl());

		this.conflictPairs.push(newConflictPair);
		this.dmoDetails.conflicts.push(newConflict.protagonist);
		this.dmoDetails.conflicts.push(newConflict.antagonist);
	}

	async deleteConflict(pairId: string, order: number): Promise<void> {
		if (this.readonly) {
			return;
		}
		await this.editorHub.deleteConflict(pairId);
		let conflictsToRemove = this.dmoDetails.conflicts.filter(conflict => conflict.pairId == pairId);

		conflictsToRemove.forEach(conflictToRemove => {
			this.dmoConflictForm.removeControl(this.getUniqueControlIdForConflictForm(order, conflictToRemove.characterType, conflictToRemove) + '-select');
			this.dmoConflictForm.removeControl(this.getUniqueControlIdForConflictForm(order, conflictToRemove.characterType, conflictToRemove) + '-checkbox');
		});

		this.dmoDetails.conflicts = [...this.dmoDetails.conflicts.filter(conflict => conflict.pairId != pairId)];

		this.resetConflictForm();
		this.setConflictValues();
	}

	private resetDmoDetailsForm(): void {
		this.dmoDetailsForm.clearValidators();
		this.dmoDetailsForm.reset();
		this.dmoDetailsValidations = [];
	}

	private setDmoDetailsValues(): void {
		this.dmoName.setValue(this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.name));
		this.movieTitle.setValue(this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.movieTitle));
		this.dmoStatus.setValue(this.dmoDetails.dmoStatusId);
		this.shortComment.setValue(this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.shortComment));
	}

	private updateDmoDetailsInitialValues(): void {
		this.dmoDetails.name = this.nnaHelpersService.sanitizeSpaces(this.dmoName.value);
		this.dmoDetails.movieTitle = this.nnaHelpersService.sanitizeSpaces(this.movieTitle.value);
		this.dmoDetails.dmoStatusId = this.dmoStatus.value;
		this.dmoDetails.shortComment = this.nnaHelpersService.sanitizeSpaces(this.shortComment.value);
	}


	private setDmoPlotDetailsValues(): void {
		this.premise.setValue(this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.premise));
		this.controllingIdea.setValue(this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.controllingIdea));
		this.didacticismDescription.setValue(this.nnaHelpersService.sanitizeSpaces(this.dmoDetails.didacticismDescription));
		this.didacticism.setValue(this.dmoDetails.didacticism);
		this.controllingIdeaType.setValue(this.dmoDetails.controllingIdeaId);
	}

	private resetDmoPlotDetailsForm(): void {
		this.dmoPlotDetailsForm.clearValidators();
		this.dmoPlotDetailsForm.reset();
		this.dmoPlotDetailsValidations = [];
	}

	private updateDmoPlotDetailsInitialValues(): void {
		this.dmoDetails.premise = this.nnaHelpersService.sanitizeSpaces(this.premise.value);
		this.dmoDetails.controllingIdea = this.nnaHelpersService.sanitizeSpaces(this.controllingIdea.value);
		this.dmoDetails.didacticismDescription = this.nnaHelpersService.sanitizeSpaces(this.didacticismDescription.value);
		this.dmoDetails.didacticism = this.didacticism.value;
		this.dmoDetails.controllingIdeaId = this.controllingIdeaType.value;
	}

	private resetConflictForm() {
		this.conflictFormValidations = [];
		this.conflictPairs = [];
		this.dmoConflictForm.reset();
	}

	private async setConflictValues(): Promise<void> {
		if (!this.dmoDetails.conflicts?.length) {
			return;
		}

		this.conflictPairs = [];
		let conflicts = this.nnaHelpersService.groupBy(this.dmoDetails.conflicts, c => c.pairId);

		for (let index = 0; index < this.nnaHelpersService.grouppedLength(conflicts); index++) {
			const conflictPair = this.nnaHelpersService.getGroupItem(conflicts, index) as DmoConflictDto[];
			let newConflictPair: any = {};
			newConflictPair.protagonist = conflictPair.find(cp => cp.characterType == 1);
			newConflictPair.antagonist = conflictPair.find(cp => cp.characterType == 2);
			newConflictPair.order = index;
			newConflictPair.pairId = newConflictPair.protagonist.pairId;
			this.conflictPairs.push(newConflictPair);
		}

		if (!this.conflictPairs?.length) {
			return;
		}

		setTimeout(() => {
			let selectNativeElements = Array.from(document.getElementsByClassName('mat-select-value')) as HTMLElement[];
			
			this.conflictPairs.forEach((conflictPair, i) => {
				this.setCharacterDataInHtml(conflictPair.protagonist, 1, i, selectNativeElements);
				this.setCharacterDataInHtml(conflictPair.antagonist, 2, i, selectNativeElements);
			});
		}, 100);
	}

	private updateDmoconflictInitialValues(update: DmoConflictDto): void {
		this.dmoDetails.conflicts.forEach(conflict => {
			if (conflict.id == update.id) {
				conflict.characterId = update.characterId;
				conflict.achieved = update.achieved;
				return;
			}
		});
	}

	private setCharacterDataInHtml(characterInConflict: DmoConflictDto, type: number, order: number, selectedInSelectElements: HTMLElement[]) {
		if (!characterInConflict?.characterId) {
			let dmoConflict = {
				id: characterInConflict.id,
				pairId: characterInConflict.pairId,
			} as DmoConflictDto;
			const emptyControlName = this.getUniqueControlIdForConflictForm(order, type, dmoConflict);
			let checkboxControl = new FormControl('');
			checkboxControl.setValue(false);
			let selectControl = new FormControl('');
			selectControl.setValue('');
			this.dmoConflictForm.addControl(emptyControlName + '-select', selectControl);
			this.dmoConflictForm.addControl(emptyControlName + '-checkbox', checkboxControl);
			return;
		}

		const character = this.dmoDetails.charactersForConflict.find(cha => cha.characterId == characterInConflict.characterId);
		const controlName = this.getUniqueControlIdForConflictForm(order, type, characterInConflict);
		
		selectedInSelectElements.forEach(selectNativeElement => {
			if (selectNativeElement.parentElement.parentElement.getAttribute('id') == controlName + '-select') {
				selectNativeElement.style.color = character.color;
			}
		});
		
		let descriptionElement = this.conflictDescriptionElements
			.toArray()
			.filter(conflictDescriptionElement => conflictDescriptionElement.nativeElement.id == controlName + '-description')[0].nativeElement;

		this.setConflictCharacterGoalDescriptionValue(character, descriptionElement);
		this.setConflictCharacterGoalAchievedCheckboxValue(character, controlName);

		this.conflictCheckboxElements.toArray().forEach(conflictCheckboxElement => {
			if (conflictCheckboxElement.name == controlName + '-checkbox') {
				conflictCheckboxElement.checked = characterInConflict.achieved;
			}
		});

		let checkboxControl = new FormControl('');
		checkboxControl.setValue(characterInConflict.achieved);
		let selectControl = new FormControl('');
		selectControl.setValue(character.characterId);

		this.dmoConflictForm.addControl(controlName + '-select', selectControl);
		this.dmoConflictForm.addControl(controlName + '-checkbox', checkboxControl);
	}

	private setConflictCharacterGoalDescriptionValue(character: DmoCharactersForConflictDto, descriptionElement: HTMLElement): void {
		if (!character?.goal) {
			return;
		}

		if (character.goal.length >= 65) {
			descriptionElement.innerText = character.goal.substring(0, 62) + '...';
			descriptionElement.style.display = 'block';
			return;
		}
		descriptionElement.innerText = character.goal;
		descriptionElement.style.display = 'block';
	}

	private setConflictCharacterGoalAchievedCheckboxValue(character: DmoCharactersForConflictDto, contronId: string): void {
		if (!character) {
			return;
		}

		let checkboxContainer = this.conflictCheckboxContainerElements
			.toArray()
			.filter(conflictCheckboxContainerElement => conflictCheckboxContainerElement.nativeElement.classList.contains(contronId + '-checkbox-container') )[0].nativeElement;

		checkboxContainer.style.display = 'block';
	}

	private clearConflictCharacterGoalDescriptionValue(contronId: string): void {
		let description = this.conflictDescriptionElements 
			.toArray()
			.filter(conflictDescriptionElement => conflictDescriptionElement.nativeElement.getAttribute('id') == (contronId + '-description'))[0].nativeElement;
		description.innerText = '';
		description.style.display = 'none';
	}

	private resetConflictCheckbox(contronId: string): void {
		this.conflictCheckboxElements.toArray().forEach(conflictCheckboxElement => {
			if (conflictCheckboxElement.name == contronId + '-checkbox') {
				conflictCheckboxElement.checked = false;
			}
		});

		let checkboxContainer = this.conflictCheckboxContainerElements
			.toArray()
			.filter(conflictCheckboxContainerElement => conflictCheckboxContainerElement.nativeElement.id == (contronId + '-checkbox-container') )[0].nativeElement;
		
		checkboxContainer.style.display = 'none';
	}

	private setColorOnSelectPick(controlId: string, color: string): void {
		let selectNativeElements = Array.from(document.getElementsByClassName('mat-select-value')) as HTMLElement[];
		selectNativeElements.forEach(selectNativeElement => {
			if (selectNativeElement.parentElement.parentElement.getAttribute('id') == controlId + '-select')
				selectNativeElement.style.color = color;
		});
	}

	private getDmoConflictFromControlName(controlName: string): DmoConflictDto {
		const fields = controlName.split('--');
		return {
			id: fields[2],
			characterId: '',
			pairId: fields[0],
			characterType: +fields[3],
		} as DmoConflictDto;
	}

}
