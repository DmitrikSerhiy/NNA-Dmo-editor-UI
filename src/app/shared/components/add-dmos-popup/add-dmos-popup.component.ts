import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DmoCollectionDto, ShortDmoDto } from '../../../layout/models';
import { Component, OnInit, ViewChild, Input, Inject, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
	selector: 'app-add-dmos-popup',
	templateUrl: './add-dmos-popup.component.html',
	styleUrls: ['./add-dmos-popup.component.scss']
})
export class AddDmosPopupComponent implements OnInit, AfterViewInit, OnDestroy {
	dmosTable: MatTableDataSource<ShortDmoDto>;
	dmos: ShortDmoDto[];
	collectionName: string;
	dmosTableColumn: string[];
	dmosCount = 0;
	@ViewChild('dmosPaginator', { static: true }) dmosPaginator: MatPaginator;
	@ViewChild('dmosSort', { static: true }) dmosSorter: MatSort;
	@ViewChild('addDmoToCollectionModal', { static: true }) addToCollectionModal: NgbActiveModal;
	selectedDmo = new SelectionModel<ShortDmoDto>(true, []);

	@Input() openModule: boolean;

	constructor(
		public dialogRef: MatDialogRef<AddDmosPopupComponent>,
		private cd: ChangeDetectorRef,
		@Inject(MAT_DIALOG_DATA) public data: DmoCollectionDto) {
			this.dmos = data.dmos;
			this.collectionName = data.collectionName;
		}

	ngAfterViewInit(): void {
		this.initializeDmosTable();
	}

	ngOnInit() {
		
	}

	ngOnDestroy(): void {
		this.resetDmosTable();
	}


	onClose(shouldSave: boolean) {
		if (!shouldSave) {
			this.dialogRef.close();
			return;
		}
		const result = this.selectedDmo.selected;
		this.dialogRef.close(result);
	}

	isAllDmoSelected() {
		const numSelected = this.selectedDmo.selected.length;
		const numRows = this.dmosTable.data.length;
		return numSelected === numRows;
	}

	dmosTableToggle() {
		this.isAllDmoSelected() 
			? this.selectedDmo.clear() 
			: this.dmosTable.data.forEach(row => this.selectedDmo.select(row));
	}

	applyDmosFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dmosTable.filter = filterValue.trim().toLowerCase();

		if (this.dmosTable.paginator) {
			this.dmosTable.paginator.firstPage();
		}
	}

	private resetDmosTable() {
		this.dmosTableColumn = null;
		this.dmosTable = null;
		this.dmosCount = null;
		this.selectedDmo.clear();
	}

	private initializeDmosTable() {
		this.dmosTableColumn = ['select', 'name', 'movieTitle'];
		this.dmosTable = new MatTableDataSource(this.dmos);
		this.dmosTable.paginator = this.dmosPaginator;
		this.dmosTable.sort = this.dmosSorter;
		this.dmosCount = this.dmos.length;
		this.cd.detectChanges();
	}
}
