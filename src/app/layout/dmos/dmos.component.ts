import { Router } from '@angular/router';
import { RemoveDmoPopupComponent } from './../../shared/components/remove-dmo-popup/remove-dmo-popup.component';
import { Subject, Observable, throwError, Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Toastr } from './../../shared/services/toastr.service';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { concatMap, takeUntil, catchError } from 'rxjs/operators';
import { ShortDmoDto } from '../models';

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
  @ViewChild('dmosPaginator', { static: true }) dmosPaginator: MatPaginator;
  @ViewChild('dmosSorter', { static: true }) dmosSorter: MatSort;
  private unsubscribe$: Subject<void> = new Subject();
  selectedDmo: ShortDmoDto;
  dmoSubscription: Subscription;

  constructor(
    private dmosService: DmosService,
    private toastr: Toastr,
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
  }

  redirectToDmo() {
    this.router.navigateByUrl('/app/editor?dmoId=' + this.selectedDmo.id);
  }

  onDmoRemove() {
    const delteDMOModal = this.matModule.open(RemoveDmoPopupComponent, {
      data: this.selectedDmo.name
    });

    delteDMOModal.afterClosed().subscribe({
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

  onRowSelect(row: ShortDmoDto) {
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

  private handleDMOSubscription(dmoObservable: Observable<ShortDmoDto[]>) {
    this.dmoSubscription = dmoObservable.subscribe({
        next: (result: ShortDmoDto[]) => {
          this.isDmosLoadings = false;
          this.allDmos = result;
          this.initializeDmosTable(this.allDmos);
        }});
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
    this.dmosTableColumns = ['name', 'movieTitle', 'dmoStatus', 'shortComment', 'mark'];
    this.dmosCount = dmos.length;
    this.shouldShowDmosTable = true;
    this.cd.detectChanges();
  }
}
