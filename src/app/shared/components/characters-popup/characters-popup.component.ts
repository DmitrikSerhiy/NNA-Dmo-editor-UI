import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap/modal/modal.module';
import { compare } from 'fast-json-patch';
import { take } from 'rxjs/internal/operators/take';
import { NnaHelpersService } from 'src/app/shared/services/nna-helpers.service';
import { EditorSharedService } from '../../services/editor-shared.service';
import { NnaBeatDto, NnaMovieCharacterInDmoDto, NnaMovieCharacterToCreateDto, NnaMovieCharacterToUpdateDto } from '../../../layout/dmo-editor/models/dmo-dtos';
import { CharactersColorPaleteService } from '../../../layout/dmo-editor/services/characters-color-palete.service';
import { CharactersService } from '../../../layout/dmo-editor/services/characters.service';

@Component({
	selector: 'app-characters-popup',
	templateUrl: './characters-popup.component.html',
	styleUrls: ['./characters-popup.component.scss']
})
export class CharactersPopupComponent implements OnInit, AfterViewInit, OnDestroy {

	charactersTableColumn: string[];
	characters: NnaMovieCharacterInDmoDto[] = [];
	characterBeats: NnaBeatDto[];
	dmoId: string;
	charactersCount: number;
	charactersTable: MatTableDataSource<any>;
	private initialAction: string = '';
	private initialCharacterIdToView: string = ''; 

	get readonly(): boolean { return this._readonly; }
	private set readonly(value: boolean) { this._readonly = value; }
	private _readonly: boolean;

	private maxEntityNameLength = 100;
	private maxLongEntityLength = 500;

	charactersForm: FormGroup;
	get name() { return this.charactersForm.get('characterNameInput'); }
	get aliases() { return this.charactersForm.get('characterAliasesInput'); }
	get color() { return this.charactersForm.get('colorInput'); }

	get goal() { return this.charactersForm.get('goalInput'); }
	get unconsciousGoal() { return this.charactersForm.get('unconsciousGoalInput'); }
	character: string[];
	get characterization() { return this.charactersForm.get('characterizationInput'); }

	get characterContrCharacterization() { return this.charactersForm.get('characterContrCharacterizationCheckbox'); }
	get characterContrCharacterizationDescription() { return this.charactersForm.get('characterContrCharacterizationDescriptionInput'); }

	get characterEmpathy() { return this.charactersForm.get('characterEmpathyCheckbox'); }
	get characterEmpathyDescription() { return this.charactersForm.get('characterEmpathyDescriptionInput'); }

	get characterSympathy() { return this.charactersForm.get('characterSympathyCheckbox'); }
	get characterSympathyDescription() { return this.charactersForm.get('characterSympathyDescriptionInput'); }

	
	showCharacterContrCharacterizationDescriptionInput: boolean = false;
	showCharacterEmpathyDescriptionInput: boolean = false;
	showCharacterSympathyDescriptionInput: boolean = false;

	selectedCharacter: NnaMovieCharacterInDmoDto;
	deleteAction: boolean = false;
	addOrEditAction: boolean = false;
	viewCharacterAction: boolean = false;
	charactersAreDirty: boolean = false;
	helpWindow: boolean = false;
	operations: string[] = [];

	private nameIsMissingValidationMessage: string;
	private aliasesNaxLengthExceededValidationMessage: string;
	private nameNaxLengthExceededValidationMessage: string;
	private goalMaxLengthExceededVaildationMessage: string;
	private unconsciousGoalMaxLengthExceededVaildationMessage: string;
	private characterizationMaxLengthExceededVaildationMessage: string;
	private characterContradictsCharacterizationDescriptionMaxLengthExceededVaildationMessage: string; // not long enough :)
	private emphatheticDescriptionMaxLengthExceededVaildationMessage: string;
	private sympatheticDescriptionMaxLengthExceededVaildationMessage: string;
	characterValidations: string[] = [];

	@ViewChild('charactersPaginator', { static: true }) charactersPaginator: MatPaginator;
	@ViewChild(MatSort) charactersSorter: MatSort;
	@ViewChild('addDmoToCollectionModal', { static: true }) addToCollectionModal: NgbActiveModal;

	@ViewChild('characterNameInput') characterNameInputElement: ElementRef;
	@ViewChildren('beatsWithCurrentCharacter') beatsWithCurrentCharacterElements: QueryList<ElementRef>;

	constructor(
		private charactersService: CharactersService,
		private nnaHelpersService: NnaHelpersService,
		private charactersColorPaleteService: CharactersColorPaleteService,
		private editorSharedService: EditorSharedService,
		public domSanitizer: DomSanitizer,
		private cd: ChangeDetectorRef,
		private dialogRef: MatDialogRef<CharactersPopupComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any
	) { 
		this.dmoId = data.dmoId;
		this.characterBeats = data.beats;
		this.readonly = data.readonly;
		
		this.nameIsMissingValidationMessage = 'Character name is missing';
		this.aliasesNaxLengthExceededValidationMessage = 'Maximum character aliases length exceeded';
		this.nameNaxLengthExceededValidationMessage = 'Maximum character name length exceeded';
		this.goalMaxLengthExceededVaildationMessage = 'Maximum goal length exceeded';
		this.unconsciousGoalMaxLengthExceededVaildationMessage = 'Maximum unconscious goal length exceeded';
		this.characterizationMaxLengthExceededVaildationMessage = 'Maximum characterization length exceeded';
		this.characterContradictsCharacterizationDescriptionMaxLengthExceededVaildationMessage = 'Maximum character contradicts characterization length exceeded';
		this.emphatheticDescriptionMaxLengthExceededVaildationMessage = 'Maximum emphathetic description length exceeded';
		this.sympatheticDescriptionMaxLengthExceededVaildationMessage = 'Maximum sympathetic description length exceeded';

		if (data.openOnAction) {
			this.initialAction = data.openOnAction.action;
			this.initialCharacterIdToView = data.openOnAction.characterId;
		}	
	}

	ngOnInit(): void {
		this.dialogRef.backdropClick().subscribe(() => this.onClose());
		this.dialogRef.disableClose = true;
		this.dialogRef.keydownEvents().subscribe($event => {
			const key = $event.which || $event.keyCode || $event.charCode;
			if (key == 27) { // esc
				this.onClose();
			}
		});

		document.addEventListener('keydown', this.keydownHandlerWrapper);
		this.charactersForm = new FormGroup({
			'characterNameInput': new FormControl({value: '', disabled: this.readonly}, [Validators.required, Validators.maxLength(60)] ),
			'characterAliasesInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(100)]),
			'colorInput': new FormControl({value: '', disabled: this.readonly}),
			'goalInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxLongEntityLength)]),
			'unconsciousGoalInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxLongEntityLength)]),
			'characterizationInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxLongEntityLength)]),
			'characterContrCharacterizationCheckbox': new FormControl({value: '', disabled: this.readonly}),
			'characterContrCharacterizationDescriptionInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxLongEntityLength)]),
			'characterEmpathyCheckbox': new FormControl({value: '', disabled: this.readonly}),
			'characterEmpathyDescriptionInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxLongEntityLength)]),
			'characterSympathyCheckbox': new FormControl({value: '', disabled: this.readonly}),
			'characterSympathyDescriptionInput': new FormControl({value: '', disabled: this.readonly}, [Validators.maxLength(this.maxLongEntityLength)]),
		});
	}

	private keydownHandlerWrapper = function($event) {
		const key = $event.which || $event.keyCode || $event.charCode;

		if (key === 13 && !$event.shiftKey) {
			$event.preventDefault();
			if (this.deleteAction == true) {
				this.onCharacterDelete();
				return;
			}
			if (this.addOrEditAction == true) {
				if (this.selectedCharacter == null) {
					this.onCharacterAdd();
					return;
				} else {
					this.onCharacterEdit();
					return;
				}
			}
			this.onCharacterToAdd();
		}
	}.bind(this);

	ngAfterViewInit(): void {
		if (this.initialAction) {
			if (this.initialAction == 'add_first_character') {
				this.onCharacterToAdd();
				this.cd.detectChanges();
			} else if (this.initialAction == 'add_character') {
				this.loadCharacters(this.onCharacterToAddWrapper);
			} else if (this.initialAction == 'view_character' && this.initialCharacterIdToView) {
				this.loadCharacters(this.onCharacterToViewWrapper);
			}
			return;
		}
		this.loadCharacters();
	}

	ngOnDestroy(): void {
		this.resetPopup();
		document.removeEventListener('keydown', this.keydownHandlerWrapper);
	}

	onPaginateChange(): void {
		this.resetSelected();
	}

	onCharacterToView(): void {
		this.selectedCharacter = this.selectedCharacter = this.characters.find(cha => cha.id == this.initialCharacterIdToView);
		this.viewCharacterAction = true;
		this.resetCharactersTable();
		this.setCharacterFormValue();
	}

	onCharacterToViewManual(): void {
		this.viewCharacterAction = true;
		this.resetCharactersTable();
		this.setCharacterFormValue();
	}

	onCharacterCancelView(): void {
		this.selectedCharacter = null;
		this.viewCharacterAction = false;
		this.resetForm();
		this.initializeCharactersTable();
	}

	onCharacterToAdd(): void {
		this.selectedCharacter = null;
		this.addOrEditAction = true;
		this.resetForm();
		this.resetCharactersTable();
		this.color.setValue(this.charactersColorPaleteService.getNotUsedColor(this.characters.map(c => c.color)));
		setTimeout(() => {
			this.characterNameInputElement.nativeElement.focus();
		}, 150);
	}

	private onCharacterToAddWrapper = function() {
		this.onCharacterToAdd();
	}.bind(this);

	private onCharacterToViewWrapper = function() {
		this.onCharacterToView();
	}.bind(this);

	preventValidationToBlink(): void {
		if (this.addOrEditAction == true) {
			if (this.name.value == '') {
				this.name.markAsPristine();
				this.name.markAsUntouched();
			}
		}
	}

	onCharacterCancelAdd(): void {
		this.resetForm();
		this.selectedCharacter = null;
		this.addOrEditAction = false;
		this.initializeCharactersTable();
	}

	onCharacterAdd(): void {
		if (!this.charactersForm.valid) {
			this.toggleValidations();
			return;
		}

		this.charactersService	
			.createCharacter({
				name: this.nnaHelpersService.sanitizeSpaces(this.name.value), 
				aliases: this.fixAliasesValue(this.aliases.value), 
				dmoId: this.dmoId,
				color: this.color.value ?? "#000000",
				goal: this.nnaHelpersService.sanitizeSpaces(this.goal.value),
				unconsciousGoal: this.nnaHelpersService.sanitizeSpaces(this.unconsciousGoal.value),
				characterization: this.nnaHelpersService.sanitizeSpaces(this.characterization.value),
				characterContradictsCharacterization: this.characterContrCharacterization.value,
				characterContradictsCharacterizationDescription: this.nnaHelpersService.sanitizeSpaces(this.characterContrCharacterizationDescription.value),
				emphathetic: this.characterEmpathy.value,
				emphatheticDescription: this.nnaHelpersService.sanitizeSpaces(this.characterEmpathyDescription.value),
				sympathetic: this.characterSympathy.value,
				sympatheticDescription: this.nnaHelpersService.sanitizeSpaces(this.characterSympathyDescription.value)
			} as NnaMovieCharacterToCreateDto)
			.pipe(take(1))
			.subscribe(() => { 
				this.charactersAreDirty = true;
				this.operations.push('add');
				this.addOrEditAction = false;
				this.resetForm();
				this.loadCharacters();
			});
	}


	onCharacterToDelete(): void {
		if (this.selectedCharacter == null) {
			return;
		}

		this.resetCharactersTable();
		this.deleteAction = true;
	}

	onCharacterCancelDelete(): void {
		this.deleteAction = false;
		this.initializeCharactersTable();
	}

	onCharacterDelete(): void {
		if (this.selectedCharacter == null) {
			this.deleteAction = false;
			return;
		}

		this.charactersService	
			.deleteCharacter(this.selectedCharacter.id)
			.pipe(take(1))
			.subscribe(() => {
				this.charactersAreDirty = true;
				this.operations.push('delete');
				this.selectedCharacter = null;
				this.deleteAction = false;
				this.loadCharacters();
			})
	}


	onCharacterCancelEdit(): void {
		this.addOrEditAction = false;
		this.resetForm();
		this.initializeCharactersTable();
	}



	onCharacterToEdit(): void {
		if (this.selectedCharacter == null) {
			return;
		}

		this.addOrEditAction = true;
		this.resetCharactersTable();
		this.setCharacterFormValue();

		setTimeout(() => {
			this.characterNameInputElement.nativeElement.focus();
		}, 150);
	}

	onCharacterEdit(): void {
		if (this.selectedCharacter == null) {
			return;
		}

		if (!this.charactersForm.valid) {
			this.toggleValidations();
			return;
		}

		const oldValue = {
			name: this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.name), 
			aliases: this.fixAliasesValue(this.selectedCharacter.aliases), 
			color: this.selectedCharacter.color ?? "#000000",
			dmoId: this.dmoId,
			goal: this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.goal),
			unconsciousGoal: this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.unconsciousGoal),
			characterization: this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.characterization),
			characterContradictsCharacterization: this.selectedCharacter.characterContradictsCharacterization,
			characterContradictsCharacterizationDescription: this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.characterContradictsCharacterizationDescription),
			emphathetic: this.selectedCharacter.emphathetic,
			emphatheticDescription: this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.emphatheticDescription),
			sympathetic: this.selectedCharacter.sympathetic,
			sympatheticDescription: this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.sympatheticDescription)
		} as NnaMovieCharacterToUpdateDto;

		const update = {
			name: this.nnaHelpersService.sanitizeSpaces(this.name.value), 
			aliases: this.fixAliasesValue(this.aliases.value), 
			color: this.color.value ?? "#000000",
			dmoId: this.dmoId,
			goal: this.nnaHelpersService.sanitizeSpaces(this.goal.value),
			unconsciousGoal: this.nnaHelpersService.sanitizeSpaces(this.unconsciousGoal.value),
			characterization: this.nnaHelpersService.sanitizeSpaces(this.characterization.value),
			characterContradictsCharacterization: this.characterContrCharacterization.value,
			characterContradictsCharacterizationDescription: this.nnaHelpersService.sanitizeSpaces(this.characterContrCharacterizationDescription.value),
			emphathetic: this.characterEmpathy.value,
			emphatheticDescription: this.nnaHelpersService.sanitizeSpaces(this.characterEmpathyDescription.value),
			sympathetic: this.characterSympathy.value,
			sympatheticDescription: this.nnaHelpersService.sanitizeSpaces(this.characterSympathyDescription.value)
		} as NnaMovieCharacterToUpdateDto;

		const patch = compare(oldValue, update);
		if (!patch?.length) {
			this.resetForm();
			this.selectedCharacter = null;
			this.addOrEditAction = false
			this.initializeCharactersTable();
			return;
		}

		this.charactersService	
			.updateCharacter(this.selectedCharacter.id, patch)
			.pipe(take(1))
			.subscribe(() => { 
				this.charactersAreDirty = true;
				this.operations.push('edit');
				this.selectedCharacter = null;
				this.addOrEditAction = false;
				this.resetForm();
				this.loadCharacters();
			});
	}

	onClose(): void {
		if (this.charactersAreDirty == false) {
			this.dialogRef.close({hasChanges: this.charactersAreDirty});
		}

		this.dialogRef.close({
			hasChanges: this.charactersAreDirty,
			operations: Array.from(new Set(this.operations)),
			changes: this.characters
		});
	}

	resetSelected(): void {
		this.selectedCharacter = null;
	}

	
	onRowSelect(row: NnaMovieCharacterInDmoDto): void {
		if (this.selectedCharacter && this.selectedCharacter === row) {
			this.selectedCharacter = null;
			return;
		}

		this.selectedCharacter = row;
	}

	onSetNextRandomColor(): void {
		const newColor = this.charactersColorPaleteService.getNotUsedColor(this.characters.map(c => c.color));
		this.color.setValue(newColor);
		this.refreshBeatsTagsWithNewColor(newColor);
	}

	setColorManually(): void {
		this.refreshBeatsTagsWithNewColor(this.color.value);
	}

	setCharacterContrCharacterization($event): void {
		this.showCharacterContrCharacterizationDescriptionInput = $event.checked;
		this.characterContrCharacterizationDescription.setValue('');
	}

	setCharacterEmpathy($event): void {
		this.showCharacterEmpathyDescriptionInput = $event.checked;
		this.characterEmpathyDescription.setValue('');
	}

	setCharacterSympathy($event): void {
		this.showCharacterSympathyDescriptionInput = $event.checked;
		this.characterSympathyDescription.setValue('');
	}

	toggleHelp(open: boolean) {
		if (open == true) {
			this.helpWindow = true;
		} else {
			this.helpWindow = false;
		}
	}

	overrideCharacterCursorStyle(rowBeatText: string): string {
		return this.editorSharedService.overrideCharacterTagStyles(rowBeatText, [{name: 'cursor', value: 'default' }]);
	}
	

	private refreshBeatsTagsWithNewColor(color: string): void {
		const parser = new DOMParser();
		Array.from(document.getElementsByClassName('temp-true-character-option'))?.forEach(tempTag => {
			tempTag.remove();
		});

		this.beatsWithCurrentCharacterElements.toArray().forEach(beatsWithCurrentCharacterElement => {
			let newTagString = this.editorSharedService.overrideCharacterTagStyles(beatsWithCurrentCharacterElement.nativeElement.innerHTML, [{name: 'borderBottomColor', value: color }]);
			let elem = document.createElement('li');
			elem.innerHTML = parser.parseFromString(newTagString, 'text/html').body.innerHTML;
			elem.style.fontSize = "14px";
			elem.style.fontFamily = '"Courier New", Courier, monospace';
			elem.classList.add('temp-true-character-option');
			beatsWithCurrentCharacterElement.nativeElement.parentNode.insertBefore(elem, beatsWithCurrentCharacterElement.nativeElement);
			beatsWithCurrentCharacterElement.nativeElement.style.display = 'none';
		 });
	}

	private selectTrueCharacterFromBeats(): string[] {
		return this.getTrueCharactersView(this.getCurrentBeatsForSelectedCharacter());
	}

	private getTrueCharactersView(beats: NnaBeatDto[], incluedeInnerTags: boolean = false, setStyle: boolean = true) {
		let trueCharacters: string[] = [];
		beats.forEach(trueCharacterBeat => {
			trueCharacters.push(this.editorSharedService.getBeatTime(trueCharacterBeat.time, true) + ' ' + decodeURIComponent(trueCharacterBeat.text))
		});
		
		return trueCharacters;
	}

	private getCurrentBeatsForSelectedCharacter(): NnaBeatDto[]  {
		const trueCharacterBeats = this.characterBeats?.filter(beat => this.selectedCharacter.characterBeatIds?.some(beatId => beatId == beat.beatId)) ?? [];
		if (trueCharacterBeats.length == 0) {
			return [];
		}

		return trueCharacterBeats;
	}

	private toggleValidations(): void {
		this.characterValidations = [];
			
		if (this.name.errors != null && this.name.errors.required) {
			this.characterValidations.push(this.nameIsMissingValidationMessage);
		}

		if (this.name.errors != null && this.name.errors.maxlength) {
			this.characterValidations.push(this.nameNaxLengthExceededValidationMessage);
		}

		if (this.aliases.errors != null && this.aliases.errors.maxlength) {
			this.characterValidations.push(this.aliasesNaxLengthExceededValidationMessage);
		}

		if (this.goal.errors != null && this.goal.errors.maxlength) {
			this.characterValidations.push(this.goalMaxLengthExceededVaildationMessage);
		}

		if (this.unconsciousGoal.errors != null && this.unconsciousGoal.errors.maxlength) {
			this.characterValidations.push(this.unconsciousGoalMaxLengthExceededVaildationMessage);
		}

		if (this.characterization.errors != null && this.characterization.errors.maxlength) {
			this.characterValidations.push(this.characterizationMaxLengthExceededVaildationMessage);
		}

		if (this.characterContrCharacterizationDescription.errors != null && this.characterContrCharacterizationDescription.errors.maxlength) {
			this.characterValidations.push(this.characterContradictsCharacterizationDescriptionMaxLengthExceededVaildationMessage);
		}

		if (this.characterEmpathyDescription.errors != null && this.characterEmpathyDescription.errors.maxlength) {
			this.characterValidations.push(this.emphatheticDescriptionMaxLengthExceededVaildationMessage);
		}

		if (this.characterSympathyDescription.errors != null && this.characterSympathyDescription.errors.maxlength) {
			this.characterValidations.push(this.sympatheticDescriptionMaxLengthExceededVaildationMessage);
		}
	}

	private fixAliasesValue(aliases: string): string {
		return aliases?.split(',').reduce((p, n) => {
			if (p.trim() == '') {
				return n.trim();
			}
			if (n.trim() == '') {
				return p.trim();
			}
			return p.trim() + ', ' + n.trim();
		}) ?? '';
	}

	private loadCharacters(callback: any = null) {
		this.charactersService
			.getCharactersFordmo(this.dmoId)
			.pipe(take(1))
			.subscribe((characters) => {
				this.characters = characters;
				this.initializeCharactersTable();
				if (callback) {
					callback();
				}
			});
	}

	private setCharacterFormValue(): void {
		this.name.setValue(this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.name));
		this.aliases.setValue(this.fixAliasesValue(this.selectedCharacter.aliases));
		this.color.setValue(this.selectedCharacter.color);

		this.goal.setValue(this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.goal));
		this.unconsciousGoal.setValue(this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.unconsciousGoal));
		this.character = this.selectTrueCharacterFromBeats();
		this.characterization.setValue(this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.characterization));
		this.characterContrCharacterization.setValue(this.selectedCharacter.characterContradictsCharacterization);
		this.characterContrCharacterizationDescription.setValue(this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.characterContradictsCharacterizationDescription));
		this.characterEmpathy.setValue(this.selectedCharacter.emphathetic);
		this.characterEmpathyDescription.setValue(this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.emphatheticDescription));
		this.characterSympathy.setValue(this.selectedCharacter.sympathetic);
		this.characterSympathyDescription.setValue(this.nnaHelpersService.sanitizeSpaces(this.selectedCharacter.sympatheticDescription));

		this.showCharacterContrCharacterizationDescriptionInput = this.characterContrCharacterization.value;
		this.showCharacterEmpathyDescriptionInput = this.characterEmpathy.value;
		this.showCharacterSympathyDescriptionInput = this.characterSympathy.value;
	}

	private resetPopup(): void {
		this.initialAction = '';
		this.deleteAction = false;
		this.addOrEditAction = false;
		this.charactersAreDirty = false;
		this.operations = [];
		this.resetForm();
		this.charactersForm = null;
		this.resetSelected();
		this.resetCharactersTable();
	}

	private resetForm(): void {
		this.name.setValue('');
		this.aliases.setValue('');
		this.color.setValue('#000000');
		this.goal.setValue('');
		this.unconsciousGoal.setValue('');
		this.character = [];
		this.characterization.setValue('');
		this.characterContrCharacterization.setValue(false);
		this.characterContrCharacterizationDescription.setValue('');
		this.characterEmpathy.setValue(false);
		this.characterEmpathyDescription.setValue('');
		this.characterSympathy.setValue(false);
		this.characterSympathyDescription.setValue('');
		this.characterValidations = [];
		this.charactersForm.clearValidators();
		this.charactersForm.markAsPristine();
		this.charactersForm.markAsUntouched();
		this.initialAction = '';
		this.initialCharacterIdToView = ''; 
		this.showCharacterContrCharacterizationDescriptionInput = false;
		this.showCharacterEmpathyDescriptionInput = false;
		this.showCharacterSympathyDescriptionInput = false;
	}

	private resetCharactersTable(): void {
		this.charactersTableColumn = [];
		this.charactersTable = null;
		this.charactersCount = 0;
	}

	private initializeCharactersTable(): void {
		this.charactersTableColumn = ['name', 'aliases', 'count'];
		this.charactersTable = new MatTableDataSource(this.characters);
		this.charactersTable.paginator = this.charactersPaginator;
		this.charactersTable.sort = this.charactersSorter;
		this.charactersCount = this.characters.length;
		this.deleteAction = false;
		this.addOrEditAction = false;
		this.viewCharacterAction = false;
		this.cd.detectChanges();
	}
}
