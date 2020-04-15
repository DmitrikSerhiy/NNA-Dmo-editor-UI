import { RemoveDmoPopupComponent } from './../../shared/components/remove-dmo-popup/remove-dmo-popup.component';
import { Subject, Observable, throwError } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Toastr } from './../../shared/services/toastr.service';
import { DmoShortDto } from './../models';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { concatMap, takeUntil, finalize, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-dmos',
  templateUrl: './dmos.component.html',
  styleUrls: ['./dmos.component.scss']
})
export class DmosComponent implements OnInit, OnDestroy {

  allDmos: DmoShortDto[];
  shouldShowDmosTable = false;
  dmosTable: MatTableDataSource<DmoShortDto>;
  dmosTableColumns: string[];
  dmosCount = 0;
  @ViewChild('dmosPaginator', { static: true }) dmosPaginator: MatPaginator;
  @ViewChild('dmosSorter', { static: true }) dmosSorter: MatSort;
  private unsubscribe$: Subject<void> = new Subject();
  selectedDmo: DmoShortDto;

  constructor(
    private dmosService: DmosService,
    private toastr: Toastr,
    public matModule: MatDialog) { }

  ngOnInit() {
    this.handleDMOSubscription(this.loadDmos());
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  redirectToDmo() {
    console.log('not implemented yet');
  }

  onDmoRemove() {
    const delteDMOModal = this.matModule.open(RemoveDmoPopupComponent, {
      data: this.selectedDmo.name
    });

    delteDMOModal.afterClosed()
      .subscribe({
        next: (shouldDelete: boolean) => {
          if (!shouldDelete) {
            return;
          }
          const deleteDMO$ = this.dmosService.deleteDmo(this.selectedDmo.id);

          const deleteAndReload$ = deleteDMO$.pipe(
            catchError((err) => throwError(err) ),
            takeUntil(this.unsubscribe$),
            concatMap(() => this.loadDmos()));

          this.handleDMOSubscription(deleteAndReload$);
        }
      });
  }

  resetSelected() {
    this.selectedDmo = null;
  }

  onRowSelect(row: DmoShortDto) {
    if (this.selectedDmo && this.selectedDmo === row) {
      this.selectedDmo = null;
      return;
    }
    this.selectedDmo = row;
  }

  applyDmosFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dmosTable.filter = filterValue.trim().toLowerCase();

    if (this.dmosTable.paginator) {
      this.dmosTable.paginator.firstPage();
    }
  }

  private handleDMOSubscription(dmoObservable: Observable<DmoShortDto[]>) {
    dmoObservable.subscribe({
        next: (result: DmoShortDto[]) => {
          this.allDmos = result;
          this.initializeDmosTable(this.allDmos);
        },
          error: (err) => { this.toastr.error(err); }
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
  }

  private initializeDmosTable(dmos: DmoShortDto[]) {
    this.dmosTable = new MatTableDataSource(dmos);
    this.dmosTable.paginator = this.dmosPaginator;
    this.dmosTable.sort = this.dmosSorter;
    this.dmosTableColumns = ['movieTitle', 'name', 'dmoStatus', 'shortComment', 'mark'];
    this.dmosCount = dmos.length;
    this.shouldShowDmosTable = true;
  }
}
