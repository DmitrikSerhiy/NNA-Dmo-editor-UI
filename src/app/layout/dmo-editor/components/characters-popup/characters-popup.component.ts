import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap/modal/modal.module';
import { take } from 'rxjs/internal/operators/take';
import { NnaMovieCharacterDto, NnaMovieCharacterToCreateDto, NnaMovieCharacterToUpdateDto } from '../../models/dmo-dtos';
import { CharactersService } from '../../services/characters.service';

@Component({
	selector: 'app-characters-popup',
	templateUrl: './characters-popup.component.html',
	styleUrls: ['./characters-popup.component.scss']
})
export class CharactersPopupComponent implements OnInit, AfterViewInit, OnDestroy {

	charactersTableColumn: string[];
	characters: NnaMovieCharacterDto[];
	dmoId: string;
	charactersCount: number;
	charactersTable: MatTableDataSource<any>;

	charactersForm: FormGroup;
	get nameInput() { return this.charactersForm.get('characterNameInput'); }
	get aliasesInput() { return this.charactersForm.get('characterAliasesInput'); }
	serverValidation: string = null;

	selectedCharacter: NnaMovieCharacterDto;
	deleteAction: boolean = false;
	addOrEditAction: boolean = false;
	charactersAreDirty: boolean = false;

	@ViewChild('charactersPaginator', { static: true }) charactersPaginator: MatPaginator;
	@ViewChild(MatSort) charactersSorter: MatSort;
	@ViewChild('addDmoToCollectionModal', { static: true }) addToCollectionModal: NgbActiveModal;

	@ViewChild('characterNameInput') characterNameInputElement: ElementRef;
	@ViewChild('characterAliasesInput') characterAliasesInputElement: ElementRef;

	// todo: add validations

	constructor(
		private charactersService: CharactersService,
		private cd: ChangeDetectorRef,
		private dialogRef: MatDialogRef<CharactersPopupComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any
	) { 
		this.characters = data.characters;
		this.dmoId = data.dmoId;
	}

	ngOnInit(): void {
		this.dialogRef.backdropClick().subscribe(() => this.onClose());
		document.addEventListener('keydown', this.keydownHandlerWrapper);
		this.charactersForm = new FormGroup({
			'characterNameInput': new FormControl('', [Validators.required]),
			'characterAliasesInput': new FormControl('')
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
		this.initializeCharactersTable();
	}

	ngOnDestroy(): void {
		this.resetPopup();
		document.removeEventListener('keydown', this.keydownHandlerWrapper);
	}


	onCharacterToAdd() {
		this.selectedCharacter = null;
		this.addOrEditAction = true;
		this.resetForm();
		this.resetCharactersTable();
		setTimeout(() => {
			this.characterNameInputElement.nativeElement.focus();
		}, 150);
	}

	onCharacterCancelAdd() {
		this.selectedCharacter = null;
		this.addOrEditAction = false;
		this.resetForm();
		this.initializeCharactersTable();
	}

	onCharacterAdd() {
		if (!this.charactersForm.valid) {
			return;
		}

		this.charactersService	
			.createCharacter({
				name: this.nameInput.value, 
				aliases: this.aliasesInput.value, 
				dmoId: this.dmoId } as NnaMovieCharacterToCreateDto)
			.pipe(take(1))
			.subscribe(() => { 
				this.charactersAreDirty = true;
				this.addOrEditAction = false;
				this.resetForm();
				this.loadCharacters();
			}, (errorMessage) => {
				this.serverValidation = errorMessage;
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
		this.nameInput.setValue(this.selectedCharacter.name);
		this.aliasesInput.setValue(this.selectedCharacter.aliases);

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
				name: this.nameInput.value, 
				aliases: this.aliasesInput.value, 
				id: this.selectedCharacter.id,
				dmoId: this.dmoId } as NnaMovieCharacterToUpdateDto)
			.pipe(take(1))
			.subscribe(() => { 
				this.charactersAreDirty = true;
				this.selectedCharacter = null;
				this.addOrEditAction = false;
				this.resetForm();
				this.loadCharacters();
			}, (errorMessage) => {
				this.serverValidation = errorMessage;
			});
	}




	onClose() {
		if (this.charactersAreDirty == false) {
			this.dialogRef.close({hasChanges: this.charactersAreDirty});
		}

		this.dialogRef.close({
			hasChanges: this.charactersAreDirty,
			changes: this.characters
		});
	}

	resetSelected(): void {
		this.selectedCharacter = null;
	}

	
	onRowSelect(row: NnaMovieCharacterDto): void {
		if (this.selectedCharacter && this.selectedCharacter === row) {
			this.selectedCharacter = null;
			return;
		}

		this.selectedCharacter = row;
	}

	private loadCharacters() {
		this.charactersService
			.getCharactersFordmo(this.dmoId)
			.pipe(take(1))
			.subscribe((characters) => {
				this.characters = characters;
				this.initializeCharactersTable();
			});
	}


	private resetPopup() {
		this.deleteAction = false;
		this.addOrEditAction = false;
		this.charactersAreDirty = false;
		this.resetForm();
		this.charactersForm = null;
		this.resetSelected();
		this.resetCharactersTable();
	}

	private resetForm() {
		this.nameInput.setValue('');
		this.aliasesInput.setValue('');
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
		this.charactersTableColumn = ['name', 'aliases'];
		this.charactersTable = new MatTableDataSource(this.characters);
		this.charactersTable.paginator = this.charactersPaginator;
		this.charactersTable.sort = this.charactersSorter;
		this.charactersCount = this.characters.length;

		this.deleteAction = false;
		this.addOrEditAction = false;
		
		this.cd.detectChanges();
	}
}
