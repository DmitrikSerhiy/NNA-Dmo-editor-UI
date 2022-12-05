import { Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DmoDetailsDto, UpdateDmoDetailsDto, UpdateDmoPlotDetailsDto  } from 'src/app/layout/models';
import { EditorHub } from '../../services/editor-hub.service';
import { compare } from 'fast-json-patch';
import { MatSelectChange } from '@angular/material/select';
import { MatCheckbox } from '@angular/material/checkbox';


@Component({
	selector: 'app-dmo-details-popup',
	templateUrl: './dmo-details-popup.component.html',
	styleUrls: ['./dmo-details-popup.component.scss']
})
export class DmoDetailsPopupComponent implements OnInit {

	dmoDetailsForm: FormGroup;
	dmoPlotDetailsForm: FormGroup;
	conflictForm: FormGroup;
	currentTabIndex: number = 0;
	helpWindow: boolean = false;
	private maxEntityNameLength = 100;
	private maxLongEntityLength = 500;
	
	private dmoDetails: DmoDetailsDto;
	private dmoId: string; 
	dmoIsLoaded: boolean = false;
	showPremiseQuestionMark: boolean = false;
	initialControllingIdeaType: number = 0;

	get dmoName() { return this.dmoDetailsForm.get('dmoNameInput'); }
	get movieTitle() { return this.dmoDetailsForm.get('movieTitleInput'); }
	get dmoStatus() { return this.dmoDetailsForm.get('dmoStatusInput'); }
	get shortComment() { return this.dmoDetailsForm.get('shortCommentInput'); }

	get premise() { return this.dmoPlotDetailsForm.get('premiseInput'); }
	get controllingIdea() { return this.dmoPlotDetailsForm.get('controllingIdeaInput'); }
	get controllingIdeaType() { return this.dmoPlotDetailsForm.get('controllingIdeaTypeRadio'); }
	get didacticism() { return this.dmoPlotDetailsForm.get('didacticismCheckbox'); }
	get didacticismDescription() { return this.dmoPlotDetailsForm.get('didacticismInput'); }

	get protagonist() { return this.conflictForm.get('protagonistInput'); }
	get antagonist() { return this.conflictForm.get('antagonistInput'); }
	get antagonistGoalAchieved() { return this.conflictForm.get('antagonistGoalCheckbox'); }
	get protagonistGoalAchieved() { return this.conflictForm.get('protagonistGoalCheckbox'); }


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
		private editorHub: EditorHub,
		@Inject(MAT_DIALOG_DATA) private data: string) {
			this.dmoId = data;

			this.maxNameLengthExceededValidationMessage = "Maximum name length exceeded";
			this.maxMovieTitleLengthExceededValidationMessage = "Maximum movie title length exceeded";
			this.maxShortCommentLengthExceededValidationMessage = "Maximum short comment length exceeded";
			this.movieTitleMissingValidationMessage = "Movie title is missing";

			this.maxPremiseLengthExceededValidationMessage = "Maximum premise length exceeded";
			this.maxControllingIdeaLengthExceededValidationMessage = "Maximum controlling idea length exceeded";
			this.maxDidacticismDescriptionLengthExceededValidationMessage = "Maximum didacticism description length exceeded";
		}

		//todo: add sanitizeSpaces for each field

	async ngOnInit(): Promise<void> {
		this.dmoDetails = await this.editorHub.getDmoDetails(this.dmoId);
		console.log(this.dmoDetails);
		this.dmoIsLoaded = true;
		this.dialogRef.backdropClick().subscribe(() => this.onClose());
		this.dmoDetailsForm = new FormGroup({
			'dmoNameInput': new FormControl('', [Validators.maxLength(this.maxEntityNameLength)]),
			'movieTitleInput': new FormControl('', [Validators.required, Validators.maxLength(this.maxEntityNameLength)]),
			'dmoStatusInput': new FormControl(''),
			'shortCommentInput': new FormControl('',  [Validators.maxLength(this.maxLongEntityLength)])
		});

		this.dmoPlotDetailsForm = new FormGroup({
			'premiseInput': new FormControl('', [Validators.maxLength(this.maxLongEntityLength)]),
			'controllingIdeaInput': new FormControl('', [Validators.maxLength(this.maxLongEntityLength)]),
			'controllingIdeaTypeRadio': new FormControl(''),
			'didacticismCheckbox': new FormControl(''),
			'didacticismInput': new FormControl('',  [Validators.maxLength(this.maxLongEntityLength)])	
		});

		this.conflictForm = new FormGroup({
			'protagonistInput': new FormControl(''),
			'antagonistInput': new FormControl(''),
			'protagonistGoalCheckbox': new FormControl(''),
			'antagonistGoalCheckbox': new FormControl('')
			
		});

		this.setDmoDetailsValues();
		this.setDmoPlotDetailsValues();
		this.setConflictValues();
	}

	async saveDmoDetails(shouldSave: boolean): Promise<void> {
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
			movieTitle: this.movieTitle.value,
			name: this.dmoName.value,
			dmoStatusId: this.dmoStatus.value,
			shortComment: this.shortComment.value
		} as UpdateDmoDetailsDto;

		const oldValue = {
			movieTitle: this.dmoDetails.movieTitle,
			name: this.dmoDetails.name,
			dmoStatusId: this.dmoDetails.dmoStatusId,
			shortComment: this.dmoDetails.shortComment
		} as UpdateDmoDetailsDto;

		const patch = compare(oldValue, update);
		if (patch?.length == 0) {
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
			premise: this.premise.value,
			controllingIdea: this.controllingIdea.value,
			didacticismDescription: this.didacticismDescription.value,
			didacticism: this.didacticism.value,
			controllingIdeaId: this.controllingIdeaType.value
		} as UpdateDmoPlotDetailsDto;

		const oldValue = {
			premise: this.dmoDetails.premise,
			controllingIdea: this.dmoDetails.controllingIdea,
			didacticismDescription: this.dmoDetails.didacticismDescription,
			didacticism: this.dmoDetails.didacticism,
			controllingIdeaId: this.dmoDetails.controllingIdeaId
		} as UpdateDmoPlotDetailsDto;

		const patch = compare(oldValue, update);
		if (patch?.length == 0) {
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

	saveConflictChanges(shouldSave: boolean): Promise<void> {
		if (this.currentTabIndex !== 2) {
			return;
		}
		
		if (shouldSave === false) {
			this.resetConflictForm();
			// todo
			return;
		}

		

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

		this.dialogRef.close({
			cancelled: false,
			tabs: this.updatedTab
		});
		this.updatedTab = [];
	}

	swipeTab($event: number): void {
		if (this.currentTabIndex === 0) {
			this.resetDmoDetailsForm();
			this.setDmoDetailsValues();
		}
		if (this.currentTabIndex === 1) {
			this.resetDmoPlotDetailsForm();
			this.setDmoPlotDetailsValues();
		}
		if (this.currentTabIndex === 2) {
			this.resetConflictForm();
			// todo
		}
		this.helpWindow = false;
		this.currentTabIndex = $event;
	} 

	setControllingIdeaType(): void {
		this.controllingIdea.value
			? this.controllingIdeaType.setValue(this.controllingIdeaType.value) 
			: this.controllingIdeaType.setValue(this.initialControllingIdeaType);
	}

	setDidacticismDescription(): void {
		if (!this.didacticism.value) {
			this.didacticismDescription.setValue('');
		}
	}


	setCharacterInConflict($event: MatSelectChange, dropdownId: string): void {
		if (!$event.value) {
			if (dropdownId == 'mat-select-value-3') { // todo: fix that shit
				this.protagonistGoalAchieved.setValue(false);
			}
			if (dropdownId == 'mat-select-value-5') {
				this.antagonistGoalAchieved.setValue(false);
			}
			return;
		}
	
		let dropdowns = Array.from(document.getElementsByClassName('mat-select-value')) as HTMLElement[];
		const character = this.dmoDetails.charactersForConflict.find(character => character.characterId == $event.value)

		if (!character) {
			return;	
		}

		dropdowns.forEach(dropdown => {
			if (dropdown.id == dropdownId) {
				dropdown.style.color = character.color;
			} 
		});

		setTimeout(() => {
			let description = (Array.from(document.getElementsByClassName(dropdownId + '-dropdown-description')) as HTMLElement[])[0];
			if (!character.goal) {
				return;
			}
			if (character.goal.length >= 65) {
				description.innerText = character.goal.substring(0, 62) + '...';
				return;
			}
			description.innerText = character.goal;
		}, 100);
	}


	private resetDmoDetailsForm(): void {
		this.dmoDetailsForm.clearValidators();
		this.dmoDetailsForm.reset();
		this.dmoDetailsValidations = [];
	}

	private setDmoDetailsValues(): void {
		this.dmoName.setValue(this.dmoDetails.name);
		this.movieTitle.setValue(this.dmoDetails.movieTitle);
		this.dmoStatus.setValue(this.dmoDetails.dmoStatusId);
		this.shortComment.setValue(this.dmoDetails.shortComment);
	}

	private updateDmoDetailsInitialValues(): void {
		this.dmoDetails.name = this.dmoName.value;
		this.dmoDetails.movieTitle = this.movieTitle.value;
		this.dmoDetails.dmoStatusId = this.dmoStatus.value;
		this.dmoDetails.shortComment = this.shortComment.value;
	}


	private setDmoPlotDetailsValues(): void {
		this.premise.setValue(this.dmoDetails.premise);
		this.controllingIdea.setValue(this.dmoDetails.controllingIdea);
		this.didacticismDescription.setValue(this.dmoDetails.didacticismDescription);
		this.didacticism.setValue(this.dmoDetails.didacticism);
		this.controllingIdeaType.setValue(this.dmoDetails.controllingIdeaId);
	}

	private resetDmoPlotDetailsForm(): void {
		this.dmoPlotDetailsForm.clearValidators();
		this.dmoPlotDetailsForm.reset();
		this.dmoPlotDetailsValidations = [];
	}

	private updateDmoPlotDetailsInitialValues(): void {
		this.dmoDetails.premise = this.premise.value;
		this.dmoDetails.controllingIdea = this.controllingIdea.value;
		this.dmoDetails.didacticismDescription = this.didacticismDescription.value;
		this.dmoDetails.didacticism = this.didacticism.value;
		this.dmoDetails.controllingIdeaId = this.controllingIdeaType.value;
	}

	private resetConflictForm() {
		let dropdowns = Array.from(document.getElementsByClassName('mat-select-value')) as HTMLElement[];
		let descriptions = Array.from(document.getElementsByClassName('dropdown-description')) as HTMLElement[];

		dropdowns.forEach(dropdown => {
			dropdown.style.color = 'unset';
		});

		descriptions.forEach(description => {
			description.innerText = '';
		});

		this.conflictForm.clearValidators();
		this.conflictForm.reset();
		this.conflictFormValidations = [];

	}

	private setConflictValues(): void {

	}
}
