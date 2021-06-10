import { CurrentSidebarService } from './../../shared/services/current-sidebar.service';
import { RemoveCollectionPopupComponent } from './../../shared/components/remove-collection-popup/remove-collection-popup.component';
import { AddDmosPopupComponent } from '../../shared/components/add-dmos-popup/add-dmos-popup.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionsManagerService } from './../../shared/services/collections-manager.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Toastr } from './../../shared/services/toastr.service';
import { DmoCollectionDto, DmoCollectionShortDto, AddDmosToCollectionDto,
   DmosIdDto, ShortDmoCollectionDto, SidebarTabs, ShortDmoDto } from './../models';
import { Component, OnInit, ViewChild, OnDestroy, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { concatMap, map, takeUntil, finalize } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { DmoCollectionsService } from 'src/app/shared/services/dmo-collections.service';
import { MatDialog } from '@angular/material/dialog';
import { RightMenuGrabberService } from 'src/app/shared/services/right-menu-grabber.service';

@Component({
  selector: 'app-dmo-collection',
  templateUrl: './dmo-collection.component.html',
  styleUrls: ['./dmo-collection.component.scss']
})
export class DmoCollectionComponent implements OnInit, OnDestroy {
  currentDmoCollection: DmoCollectionDto;
  shouldCollectionShowTable = false;
  awaitingForDmos = false;
  showPopupOverview = false;
  showSearchContainer = false;
  collectionTable: MatTableDataSource<ShortDmoDto>;
  collectionTableColumn: string[];
  collectionLength = 0;
  selectedDmoInCollection: ShortDmoDto;
  dmoSubscription: Subscription;
  @ViewChild('collectionPaginator', { static: true }) collectionPaginator: MatPaginator;
  @ViewChild('collectionSort', { static: true }) collectionSorter: MatSort;
  @ViewChild('removeFullCollectionModal', { static: true }) removeCollectionModal: NgbActiveModal;
  @ViewChild('addDmoToCollectionModal', { static: true }) addToCollectionModal: NgbActiveModal;
  @ViewChild('editCollectionNameField', {static: true}) collectionNameField: ElementRef;

  editCollectionNameForm: FormGroup;
  get collectionName() { return this.editCollectionNameForm.get('collectionName'); }
  showEditForm = false;
  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private dmoCollectionService: DmoCollectionsService,
    public matModule: MatDialog,
    private toastr: Toastr,
    private router: Router,
    private collectionManager: CollectionsManagerService,
    private currentSidebarService: CurrentSidebarService) { }

  ngOnInit() {
    this.editCollectionNameForm = new FormGroup({
      'collectionName': new FormControl('', [Validators.required, Validators.maxLength(20)])
    });

    this.dmoSubscription = this.loadDmos();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.dmoSubscription.unsubscribe();
  }

  onRowSelect(row: ShortDmoDto) {
    if (this.showEditForm) {
      return;
    }

    if (this.selectedDmoInCollection && this.selectedDmoInCollection === row) {
      this.selectedDmoInCollection = null;
      return;
    }
    this.selectedDmoInCollection = row;
  }

  redirectToDmo() {
    if (!this.selectedDmoInCollection) {
      return;
    }
    this.router.navigateByUrl('/app/editor?dmoId=' + this.selectedDmoInCollection.id);
  }

  removeFromCollection() {
    if (!this.selectedDmoInCollection) {
      return;
    }

    const removeFromCollection$ = this.dmoCollectionService
      .removeFromCollection(this.selectedDmoInCollection.id, this.currentDmoCollection.id);

    const removeAndReload$ = removeFromCollection$.pipe(
      takeUntil(this.unsubscribe$),
      map(() => this.loadDmos()));

    removeAndReload$.subscribe({
      error: (err) => { this.toastr.error(err); }
    });
  }

  onEditCollectionName() {
    if (this.editCollectionNameForm.valid) {
      const newCollectionName = this.editCollectionNameForm.get('collectionName').value;
      if (this.currentDmoCollection.collectionName === newCollectionName) {
        this.hideEditCollectionNameForm();
        return;
      }

      const collectionId = this.collectionManager.getCurrentCollectionId();
      const updateCollectionName$ = this.dmoCollectionService.updateCollectionName(collectionId, newCollectionName);
      const getCollectionName$ = this.dmoCollectionService.getCollectionName(collectionId);

      const updateAndGet$ =
        updateCollectionName$.pipe(
          takeUntil(this.unsubscribe$),
          finalize(() => this.hideEditCollectionNameForm()),
          concatMap(() => getCollectionName$.pipe(
            takeUntil(this.unsubscribe$),
            finalize(() => this.collectionManager.setCollectionId(collectionId)),
            map((response: DmoCollectionShortDto) => {
              this.currentDmoCollection.collectionName = response.collectionName;
            }))
          ));

      updateAndGet$.subscribe({
        error: (err) => { this.toastr.error(err); },
      });
    }
  }

  async onAddDmo() {
    this.awaitingForDmos = true;
    this.showPopupOverview = true;
    const collectionWithDmo = new ShortDmoCollectionDto();
    collectionWithDmo.collectionName = this.currentDmoCollection.collectionName;

    const collectionId = this.collectionManager.getCurrentCollectionId();
    await this.dmoCollectionService.getExcludedDmos(collectionId).toPromise()
      .then((dmos: ShortDmoDto[]) => collectionWithDmo.dmos = 
        dmos.map(d => { 
          let dmo = new ShortDmoDto(d.name, d.movieTitle);
          dmo.id = d.id;
          dmo.shortComment = d.shortComment;
          return dmo;
        })
      )
      .catch((err) => this.toastr.error(err));

    this.awaitingForDmos = false;
    const dialogRef = this.matModule.open(AddDmosPopupComponent, {
      data: collectionWithDmo,
      minWidth: '430px'
    });

    dialogRef.afterClosed()
      .subscribe({
        next: (selectDmos: ShortDmoDto[]) => {
          this.showPopupOverview = false;
          if (!selectDmos) {
            return;
          }

          const dto = new AddDmosToCollectionDto();
          dto.collectionId = collectionId;
          dto.dmos = selectDmos.map(d => new DmosIdDto(d.id));

          const addToCollection$ = this.dmoCollectionService.addDmosToCollection(dto);
          addToCollection$.pipe(takeUntil(this.unsubscribe$));
          addToCollection$.subscribe({
            next: () => { this.loadDmos(); },
            error: (err) => { this.toastr.error(err); }
          });
        }
      });
  }

  onRemoveCollection() {
    const delteCollectionModal = this.matModule.open(RemoveCollectionPopupComponent, {
      data: this.currentDmoCollection.collectionName
    });

    delteCollectionModal.afterClosed()
    .subscribe({
      next: (shouldDelete: boolean) => {
        if (!shouldDelete) {
          return;
        }
        const deleteAndRedirect$ = this.dmoCollectionService.deleteCollection(this.currentDmoCollection.id);

        deleteAndRedirect$.subscribe({
          next: () => { this.redirectAfterRemove(); },
          error: (err) => { this.toastr.error(err); },
        });
      }
    });
  }

  hideEditCollectionNameForm() {
    this.editCollectionNameForm.reset();
    this.showEditForm = false;
  }

  showEditCollectionNameForm() {
    this.editCollectionNameForm.get('collectionName').setValue(this.currentDmoCollection.collectionName);
    this.showEditForm = true;
    this.selectedDmoInCollection = null;

    setTimeout(() => {
      this.collectionNameField.nativeElement.focus();
    }, 100);
  }

  applyCollectionFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.collectionTable.filter = filterValue.trim().toLowerCase();

    if (this.collectionTable.paginator) {
      this.collectionTable.paginator.firstPage();
    }
  }

  resetSelected() {
    this.selectedDmoInCollection = null;
  }

  toggleSearchContainer(event: any) {
    (event.target as HTMLInputElement).value = '';
    this.showSearchContainer = !this.showSearchContainer;
  }

  private redirectAfterRemove() {
    this.currentSidebarService.setMenu(null);
    this.collectionManager.setCollectionId('');
    this.router.navigateByUrl('/app');
  }

  private loadDmos() {
    this.resetCollectionTable();
    const collectionId = this.collectionManager.getCurrentCollectionId();
    return this.dmoCollectionService.getWithDmos(collectionId)
      .subscribe({
        next: (response: DmoCollectionDto) => {
          this.currentDmoCollection = response;
          this.initializeCollectionTable(this.currentDmoCollection.dmos);
          this.collectionManager.setCollectionId(collectionId); // this will trigger collections reload
        },
        error: (err) => { this.toastr.error(err); }
      });
  }

  private resetCollectionTable() {
    this.currentDmoCollection = null;
    this.shouldCollectionShowTable = false;
    this.collectionTable = null;
    this.collectionTableColumn = null;
    this.collectionLength = 0;
    this.selectedDmoInCollection = null;
    this.hideEditCollectionNameForm();
    this.showEditForm = false;
  }

  private initializeCollectionTable(dataSource: ShortDmoDto[]) {
    this.collectionTableColumn = ['name', 'movieTitle', 'dmoStatus', 'shortComment', 'mark'];
    this.collectionTable = new MatTableDataSource(dataSource);
    this.collectionTable.paginator = this.collectionPaginator;
    this.collectionTable.sort = this.collectionSorter;
    this.collectionLength = this.currentDmoCollection.dmos.length;
    this.shouldCollectionShowTable = true;
  }
}
