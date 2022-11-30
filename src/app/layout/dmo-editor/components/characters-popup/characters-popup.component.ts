import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap/modal/modal.module';
import { take } from 'rxjs/internal/operators/take';
import { NnaHelpersService } from 'src/app/shared/services/nna-helpers.service';
import { NnaMovieCharacterInDmoDto, NnaMovieCharacterToCreateDto, NnaMovieCharacterToUpdateDto } from '../../models/dmo-dtos';
import { CharactersColorPaleteService } from '../../services/characters-color-palete.service';
import { CharactersService } from '../../services/characters.service';

@Component({
	selector: 'app-characters-popup',
	templateUrl: './characters-popup.component.html',
	styleUrls: ['./characters-popup.component.scss']
})
export class CharactersPopupComponent implements OnInit, AfterViewInit, OnDestroy {

	charactersTableColumn: string[];
	characters: NnaMovieCharacterInDmoDto[] = [];
	dmoId: string;
	charactersCount: number;
	charactersTable: MatTableDataSource<any>;
	private initialAction: string = '';

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

	serverValidation: string = null;

	selectedCharacter: NnaMovieCharacterInDmoDto;
	deleteAction: boolean = false;
	addOrEditAction: boolean = false;
	charactersAreDirty: boolean = false;
	operations: string[] = [];

	@ViewChild('charactersPaginator', { static: true }) charactersPaginator: MatPaginator;
	@ViewChild(MatSort) charactersSorter: MatSort;
	@ViewChild('addDmoToCollectionModal', { static: true }) addToCollectionModal: NgbActiveModal;

	@ViewChild('characterNameInput') characterNameInputElement: ElementRef;

	constructor(
		private charactersService: CharactersService,
		private nnaHelpersService: NnaHelpersService,
		private charactersColorPaleteService: CharactersColorPaleteService,
		private cd: ChangeDetectorRef,
		private dialogRef: MatDialogRef<CharactersPopupComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any
	) { 
		this.dmoId = data.dmoId;	
		if (data.openOnAction) {
			this.initialAction = data.openOnAction.action; 
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
		})

		document.addEventListener('keydown', this.keydownHandlerWrapper);
		this.charactersForm = new FormGroup({
			'characterNameInput': new FormControl('', [Validators.required, Validators.maxLength(60)]),
			'characterAliasesInput': new FormControl('', [Validators.maxLength(this.maxEntityNameLength)]),
			'colorInput': new FormControl(''),
			'goalInput': new FormControl('', [Validators.maxLength(this.maxLongEntityLength)]),
			'unconsciousGoalInput': new FormControl('', [Validators.maxLength(this.maxLongEntityLength)]),
			'characterizationInput': new FormControl('', [Validators.maxLength(this.maxLongEntityLength)]),
			'characterContrCharacterizationCheckbox': new FormControl(''),
			'characterContrCharacterizationDescriptionInput': new FormControl('', [Validators.maxLength(this.maxLongEntityLength)]),
			'characterEmpathyCheckbox': new FormControl(''),
			'characterEmpathyDescriptionInput': new FormControl('', [Validators.maxLength(this.maxLongEntityLength)]),
			'characterSympathyCheckbox': new FormControl(''),
			'characterSympathyDescriptionInput': new FormControl('', [Validators.maxLength(this.maxLongEntityLength)]),
		});
	}

	private keydownHandlerWrapper = function($event) {
		const key = $event.which || $event.keyCode || $event.charCode;

		if (key === 13) {
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
				this.loadCharacters(this.onCharacterToAddWeapper);
			}
			this.initialAction = '';
			return;
		}
		this.loadCharacters();
	}

	ngOnDestroy(): void {
		this.resetPopup();
		document.removeEventListener('keydown', this.keydownHandlerWrapper);
	}

	onPaginateChange() {
		this.resetSelected();
	}


	onCharacterToAdd() {
		this.selectedCharacter = null;
		this.addOrEditAction = true;
		this.resetForm();
		this.resetCharactersTable();
		this.color.setValue(this.charactersColorPaleteService.getNotUsedColor(this.characters.map(c => c.color)));
		setTimeout(() => {
			this.characterNameInputElement.nativeElement.focus();
		}, 150);
	}

	private onCharacterToAddWeapper = function() {
		this.onCharacterToAdd();
	}.bind(this);

	preventValidationToBlink(): void {
		if (this.addOrEditAction == true) {
			if (this.name.value == '') {
				this.name.markAsPristine();
				this.name.markAsUntouched();
			}
		}
	}

	onCharacterCancelAdd() {
		this.resetForm();
		this.selectedCharacter = null;
		this.addOrEditAction = false;
		this.initializeCharactersTable();
	}

	onCharacterAdd() {
		if (!this.charactersForm.valid) {
			return;
		}

		this.charactersService	
			.createCharacter({
				name: this.nnaHelpersService.sanitizeSpaces(this.name.value), 
				aliases: this.fixAliasesValue(this.aliases.value), 
				dmoId: this.dmoId,
				color: this.color.value ?? "#000000",
				goal: this.goal.value,
				unconsciousGoal: this.unconsciousGoal.value,
				characterization: this.characterization.value,
				characterContradictsCharacterization: this.characterContrCharacterization.value,
				characterContradictsCharacterizationDescription: this.characterContrCharacterizationDescription.value,
				emphathetic: this.characterEmpathy.value,
				emphatheticDescription: this.characterEmpathyDescription.value,
				sympathetic: this.characterSympathy.value,
				sympatheticDescription: this.characterSympathyDescription.value
			} as NnaMovieCharacterToCreateDto)
			.pipe(take(1))
			.subscribe(() => { 
				this.charactersAreDirty = true;
				this.operations.push('add');
				this.addOrEditAction = false;
				this.resetForm();
				this.loadCharacters();
			}, (errorMessage) => {
				if (!errorMessage.isHandled) {
					this.serverValidation = errorMessage;
				}
			});
	}


	onCharacterToDelete() {
		if (this.selectedCharacter == null) {
			return;
		}

		this.resetCharactersTable();
		this.deleteAction = true;
	}

	onCharacterCancelDelete() {
		this.deleteAction = false;
		this.initializeCharactersTable();
	}

	onCharacterDelete() {
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


	onCharacterCancelEdit() {
		this.addOrEditAction = false;
		this.resetForm();
		this.initializeCharactersTable();
	}



	onCharacterToEdit() {
		if (this.selectedCharacter == null) {
			return;
		}

		this.addOrEditAction = true;
		this.resetCharactersTable();
		this.name.setValue(this.selectedCharacter.name);
		this.aliases.setValue(this.selectedCharacter.aliases);
		this.color.setValue(this.selectedCharacter.color);

		this.goal.setValue(this.selectedCharacter.goal);
		this.unconsciousGoal.setValue(this.selectedCharacter.unconsciousGoal);
		this.character = this.selectedCharacter.character;
		this.characterization.setValue(this.selectedCharacter.characterization);

		this.characterContrCharacterization.setValue(this.selectedCharacter.characterContradictsCharacterization);
		this.characterContrCharacterizationDescription.setValue(this.selectedCharacter.characterContradictsCharacterizationDescription);
		this.characterEmpathy.setValue(this.selectedCharacter.emphathetic);
		this.characterEmpathyDescription.setValue(this.selectedCharacter.emphatheticDescription);
		this.characterSympathy.setValue(this.selectedCharacter.sympathetic);
		this.characterSympathyDescription.setValue(this.selectedCharacter.sympatheticDescription);

		setTimeout(() => {
			this.characterNameInputElement.nativeElement.focus();
		}, 150);
	}

	onCharacterEdit() {
		if (this.selectedCharacter == null || !this.charactersForm.valid) {
			return;
		}

		this.charactersService	
			.updateCharacter({
				name: this.nnaHelpersService.sanitizeSpaces(this.name.value), 
				aliases: this.fixAliasesValue(this.aliases.value), 
				color: this.color.value ?? "#000000",
				id: this.selectedCharacter.id,
				dmoId: this.dmoId,
				goal: this.goal.value,
				unconsciousGoal: this.unconsciousGoal.value,
				characterization: this.characterization.value,
				characterContradictsCharacterization: this.characterContrCharacterization.value,
				characterContradictsCharacterizationDescription: this.characterContrCharacterizationDescription.value,
				emphathetic: this.characterEmpathy.value,
				emphatheticDescription: this.characterEmpathyDescription.value,
				sympathetic: this.characterSympathy.value,
				sympatheticDescription: this.characterSympathyDescription.value
			} as NnaMovieCharacterToUpdateDto)
			.pipe(take(1))
			.subscribe(() => { 
				this.charactersAreDirty = true;
				this.operations.push('edit');
				this.selectedCharacter = null;
				this.addOrEditAction = false;
				this.resetForm();
				this.loadCharacters();
			}, (errorMessage) => {
				if (!errorMessage.isHandled) {
					this.serverValidation = errorMessage;
				}
			});
	}




	onClose() {
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

	onSetNextRandomColor() {
		this.color.setValue(this.charactersColorPaleteService.getNotUsedColor(this.characters.map(c => c.color)));
	}

	setCharacterContrCharacterization() {
		this.showCharacterContrCharacterizationDescriptionInput = !this.showCharacterContrCharacterizationDescriptionInput;
	}

	setCharacterEmpathy() {
		this.showCharacterEmpathyDescriptionInput = !this.showCharacterEmpathyDescriptionInput;
	}

	setCharacterSympathy() {
		this.showCharacterSympathyDescriptionInput = !this.showCharacterSympathyDescriptionInput;
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

	private resetPopup() {
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

	private resetForm() {
		this.name.setValue('');
		this.aliases.setValue('');
		this.color.setValue('#000000');

		this.goal.setValue('');
		this.unconsciousGoal.setValue('');
		this.character = null;
		this.characterization.setValue('');

		this.characterContrCharacterization.setValue(false);
		this.characterContrCharacterizationDescription.setValue('');
		this.characterEmpathy.setValue(false);
		this.characterEmpathyDescription.setValue('');
		this.characterSympathy.setValue(false);
		this.characterSympathyDescription.setValue('');

		this.serverValidation = null;
		this.charactersForm.clearValidators();
		this.charactersForm.markAsPristine();
		this.charactersForm.markAsUntouched();
	}

	private resetCharactersTable() {
		this.charactersTableColumn = [];
		this.charactersTable = null;
		this.charactersCount = 0;
	}

	private initializeCharactersTable() {
		this.charactersTableColumn = ['name', 'aliases', 'count'];
		this.charactersTable = new MatTableDataSource(this.characters);
		this.charactersTable.paginator = this.charactersPaginator;
		this.charactersTable.sort = this.charactersSorter;
		this.charactersCount = this.characters.length;

		this.deleteAction = false;
		this.addOrEditAction = false;
		
		this.cd.detectChanges();
	}
}
