import { Router } from '@angular/router';
import { RemoveDmoPopupComponent } from './../../shared/components/remove-dmo-popup/remove-dmo-popup.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { concatMap, takeUntil, catchError } from 'rxjs/operators';
import { ShortDmoDto } from '../models';
import { Subject } from 'rxjs/internal/Subject';
import { Subscription } from 'rxjs/internal/Subscription';
import { throwError } from 'rxjs/internal/observable/throwError';
import { Observable } from 'rxjs/internal/Observable';

@Component({
	selector: 'app-dmos',
	templateUrl: './dmos.component.html',
	styleUrls: ['./dmos.component.scss']
})
export class DmosComponent implements OnInit, AfterViewInit, OnDestroy {

	isDmosLoadings = true;
	allDmos: ShortDmoDto[];
	shouldShowDmosTable = false;
	dmosTable: MatTableDataSource<ShortDmoDto>;
	dmosTableColumns: string[];
	dmosCount = 0;
	showFilterMark: boolean = false;
	showDmosButtons: boolean = true;
	showDmosHeader: boolean = true;
	@ViewChild('dmosPaginator', { static: true }) dmosPaginator: MatPaginator;
	@ViewChild('dmosSorter', { static: true }) dmosSorter: MatSort;
	@ViewChild('filterInput') filterInputElement: ElementRef

	private unsubscribe$: Subject<void> = new Subject();
	selectedDmo: ShortDmoDto;
	dmoSubscription: Subscription;
	deleteDmoModalSubscription: Subscription;

	constructor(
		private dmosService: DmosService,
		public matModule: MatDialog,
		private router: Router,
		private cd: ChangeDetectorRef) { }

	ngAfterViewInit(): void {
		this.handleDMOSubscription(this.loadDmos());
	}

	ngOnInit() {

	}

	ngOnDestroy(): void {
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
		this.dmoSubscription?.unsubscribe();
		this.deleteDmoModalSubscription?.unsubscribe();
	}

	onPaginateChange() {
		this.resetSelected();
	}

	redirectToDmo() {
		this.router.navigateByUrl('/app/editor?dmoId=' + this.selectedDmo.id);
	}

	onDmoRemove() {
		const delteDMOModal = this.matModule.open(RemoveDmoPopupComponent, {
			data: this.selectedDmo.movieTitle
		});

		this.deleteDmoModalSubscription = delteDMOModal.afterClosed().subscribe({
			next: (shouldDelete: boolean) => {
				if (!shouldDelete) {
					return;
				}
				const deleteDMO$ = this.dmosService.deleteDmo(this.selectedDmo.id);

				const deleteAndReload$ = deleteDMO$.pipe(
					catchError((err) => throwError(err)),
					takeUntil(this.unsubscribe$),
					concatMap(() => this.loadDmos()));

				this.handleDMOSubscription(deleteAndReload$);
			}
		});
	}

	resetSelected() {
		this.selectedDmo = null;
	}

	onRowSelect(row: ShortDmoDto) {
		if (this.selectedDmo && this.selectedDmo === row) {
			this.selectedDmo = null;
			this.showDmosHeader = true;
			return;
		}
		this.selectedDmo = row;

		if (window.innerWidth < 900) {
			this.showDmosHeader = false;
		}
	}

	applyDmosFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value?.trim().toLowerCase();
		if (filterValue) {
			this.showFilterMark = true;
		} else {
			this.showFilterMark = false;
		}
		this.dmosTable.filter = filterValue;

		if (this.dmosTable.paginator) {
			this.dmosTable.paginator.firstPage();
		}
	}

	clearFilter() {
		this.showFilterMark = false;
		this.dmosTable.filter = '';
		this.filterInputElement.nativeElement.value = '';
		if (this.dmosTable.paginator) {
			this.dmosTable.paginator.firstPage();
		}
	}

	focusFilterInput() {
		this.showDmosButtons = false;
		if (window.innerWidth < 850) {
			this.showDmosHeader = false;
		}
	}

	blurFilterInput() {
		this.showDmosButtons = true;
		this.showDmosHeader = true;
	}

	private handleDMOSubscription(dmoObservable: Observable<ShortDmoDto[]>) {
		this.dmoSubscription = dmoObservable.subscribe({
			next: (result: ShortDmoDto[]) => {
				this.isDmosLoadings = false;
				this.allDmos = result;
				this.initializeDmosTable(this.allDmos);
			}
		});
	}

	private loadDmos() {
		this.resetDmosTable();
		return this.dmosService.getAlldmos()
			.pipe(takeUntil(this.unsubscribe$));
	}

	private resetDmosTable() {
		this.shouldShowDmosTable = false;
		this.dmosTable = null;
		this.dmosTableColumns = null;
		this.dmosCount = 0;
		this.selectedDmo = null;
		this.cd.detectChanges();
	}

	private initializeDmosTable(dmos: ShortDmoDto[]) {
		this.dmosTable = new MatTableDataSource(dmos);
		this.dmosTable.paginator = this.dmosPaginator;
		this.dmosTable.sort = this.dmosSorter;
		this.dmosTableColumns = ['movieTitle', 'dmoStatus', 'shortComment'];
		this.dmosCount = dmos.length;
		this.shouldShowDmosTable = true;
		this.cd.detectChanges();
	}
}
