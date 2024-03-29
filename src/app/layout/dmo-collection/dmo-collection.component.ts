import { CurrentSidebarService } from './../../shared/services/current-sidebar.service';
import { RemoveCollectionPopupComponent } from './../../shared/components/remove-collection-popup/remove-collection-popup.component';
import { AddDmosPopupComponent } from '../../shared/components/add-dmos-popup/add-dmos-popup.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionsManagerService } from './../../shared/services/collections-manager.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DmoCollectionDto, DmoCollectionShortDto, AddDmosToCollectionDto,
   DmosIdDto, ShortDmoCollectionDto, ShortDmoDto, SidebarTabs } from './../models';
import { Component, OnInit, ViewChild, OnDestroy, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { concatMap, map, takeUntil, finalize } from 'rxjs/operators';
import { DmoCollectionsService } from 'src/app/shared/services/dmo-collections.service';
import { MatDialog } from '@angular/material/dialog';
import { RightMenuGrabberService } from 'src/app/shared/services/right-menu-grabber.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { Subject } from 'rxjs/internal/Subject';
import { NnaHelpersService } from 'src/app/shared/services/nna-helpers.service';

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
	showFilterMark: boolean = false;
	showCollectionName: boolean = true;
	collectionTable: MatTableDataSource<ShortDmoDto>;
	collectionTableColumn: string[];
	collectionLength = 0;
	selectedDmoInCollection: ShortDmoDto;
	private collectionSubsctiption: Subscription;
	private removeFromCollectionSub: Subscription;
	private updateDmosSub: Subscription;
	private addToCollectionSub: Subscription;
	private deleteCollectionSub: Subscription;
	private loadDmosSub: Subscription;
	private dialogSubscription: Subscription;

	@ViewChild('collectionPaginator', { static: true }) collectionPaginator: MatPaginator;
	@ViewChild('collectionSort', { static: true }) collectionSorter: MatSort;
	@ViewChild('removeFullCollectionModal', { static: true }) removeCollectionModal: NgbActiveModal;
	@ViewChild('addDmoToCollectionModal', { static: true }) addToCollectionModal: NgbActiveModal;
	@ViewChild('editCollectionNameField') editCollectionNameField: ElementRef;
	@ViewChildren('dmoActionButtons') dmoActionButtons: QueryList<ElementRef>;
	@ViewChild('filterInput') filterInputElement: ElementRef

	editCollectionNameForm: FormGroup;
	get collectionName() { return this.editCollectionNameForm.get('collectionName'); }
	showEditForm = false;
	private unsubscribe$: Subject<void> = new Subject();

	constructor(
		private dmoCollectionService: DmoCollectionsService,
		private nnaHelpersService: NnaHelpersService,
		public matModule: MatDialog,
		private router: Router,
		private route: ActivatedRoute,
		private collectionManager: CollectionsManagerService,
		private currentSidebarService: CurrentSidebarService,
		private rightMenuGrabberService: RightMenuGrabberService) { }

	ngOnInit() {
		this.editCollectionNameForm = new FormGroup({
			'collectionName': new FormControl('', [Validators.required, Validators.maxLength(60)])
		});

		let collectionId = this.collectionManager.getCurrentCollectionId();
		if (!collectionId) {
			collectionId = this.route.snapshot.queryParamMap.get("collectionId");
			this.collectionManager.setCollectionId(collectionId, true);
		}
		if (!collectionId) {
			this.router.navigate(['/app']);
		}

		this.collectionSubsctiption = this.collectionManager.currentCollectionObserver.subscribe({next: (_) => this.loadDmos(this.collectionManager.getCurrentCollectionId()) } );
	}

	ngOnDestroy(): void {
		this.collectionSubsctiption?.unsubscribe();
		this.removeFromCollectionSub?.unsubscribe();
		this.updateDmosSub?.unsubscribe();
		this.addToCollectionSub?.unsubscribe();
		this.deleteCollectionSub?.unsubscribe();
		this.loadDmosSub?.unsubscribe();
		this.dialogSubscription?.unsubscribe();
		
		this.collectionManager.setCollectionId('');
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
	}

	onPaginateChange() : void {
		this.resetSelected();
	}

	onRowSelect(rowId: string) {
		this.showEditForm = false;

		this.dmoActionButtons.toArray().forEach(dabtns => dabtns.nativeElement.classList.remove("action-wrapper-visibility"));
		let htmlRow = this.dmoActionButtons.toArray().find(dabtns => dabtns.nativeElement.id == rowId)?.nativeElement;
		if (!htmlRow) {
			return;
		}
		
		if (this.selectedDmoInCollection?.id == rowId) {
			this.selectedDmoInCollection = null;
			htmlRow.classList.remove("action-wrapper-visibility");
			return;
		}
		htmlRow.classList.add("action-wrapper-visibility");
		this.selectedDmoInCollection = this.currentDmoCollection.dmos.find(d => d.id == rowId);
	}

	redirectToDmo() {
		if (!this.selectedDmoInCollection) {
			return;
		}

		this.rightMenuGrabberService.hideGrabber();
		this.currentSidebarService.setMenu(SidebarTabs.none);
		this.router.navigateByUrl('/app/editor?dmoId=' + this.selectedDmoInCollection.id);
	}

	removeFromCollection() {
		if (!this.selectedDmoInCollection) {
			return;
		}

		this.dmoActionButtons.toArray().forEach(dabtns => dabtns.nativeElement.classList.remove("action-wrapper-visibility"));

		const removeFromCollection$ = this.dmoCollectionService
			.removeFromCollection(this.selectedDmoInCollection.id, this.currentDmoCollection.id);

		const removeAndReload$ = removeFromCollection$.pipe(
			map(() => this.loadDmos(this.currentDmoCollection.id)));

		this.removeFromCollectionSub = removeAndReload$.subscribe();
	}

	onEditCollectionName() {
		if (this.editCollectionNameForm.valid) {
			const newCollectionName = this.nnaHelpersService.sanitizeSpaces(this.editCollectionNameForm.get('collectionName').value);
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
						map((response: DmoCollectionShortDto) => {
							this.currentDmoCollection.collectionName = response.collectionName;
						})
					))
				);

			this.updateDmosSub = updateAndGet$.subscribe();
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
				dmos.map(dmo => { 
					return {
						id: dmo.id,
						shortComment: dmo.shortComment,
						name: dmo.name,
						movieTitle: dmo.movieTitle,
					} as ShortDmoDto;
				})
			);

		this.awaitingForDmos = false;
		const dialogRef = this.matModule.open(AddDmosPopupComponent, {
			data: collectionWithDmo,
			minWidth: '430px'
		});

		this.dialogSubscription = dialogRef.afterClosed().subscribe({
			next: (selectDmos: ShortDmoDto[]) => {
				this.showPopupOverview = false;
				if (!selectDmos) {
					return;
				}

				const dto = new AddDmosToCollectionDto();
				dto.collectionId = collectionId;
				dto.dmos = selectDmos.map(d => new DmosIdDto(d.id));

				const addToCollection$ = this.dmoCollectionService.addDmosToCollection(dto);

				this.addToCollectionSub = addToCollection$.subscribe({
					next: () => this.loadDmos(this.currentDmoCollection.id)
				});
			}
		});
	}

	async onRemoveCollection() {
		const delteCollectionModal = this.matModule.open(RemoveCollectionPopupComponent, {
			data: this.currentDmoCollection.collectionName
		});

		let shouldDelete = await delteCollectionModal.afterClosed().toPromise();
		if (!shouldDelete) {
			return;
		} 

		const deleteAndRedirect$ = this.dmoCollectionService.deleteCollection(this.currentDmoCollection.id);
		this.deleteCollectionSub = deleteAndRedirect$.subscribe(() => this.redirectAfterRemove());
	}

	hideEditCollectionNameForm() {
		this.editCollectionNameForm.reset();
		this.showEditForm = false;
	}

	showEditCollectionNameForm() {
		this.editCollectionNameForm.get('collectionName').setValue(this.currentDmoCollection.collectionName);
		this.dmoActionButtons.toArray().forEach(dabtns => dabtns.nativeElement.classList.remove("action-wrapper-visibility"));
		
		this.showEditForm = true;
		this.selectedDmoInCollection = null;
		
		setTimeout(() => {
			this.editCollectionNameField.nativeElement.focus();
		}, 100);
	}

	applyCollectionFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value?.trim().toLowerCase();;
		if (filterValue) {
			this.showFilterMark = true;
		} else {
			this.showFilterMark = false;
		}
	
		this.collectionTable.filter = filterValue;
		if (this.collectionTable.paginator) {
			this.collectionTable.paginator.firstPage();
		}
	}

	clearFilter() {
		this.collectionTable.filter = '';
		this.showFilterMark = false;
		this.filterInputElement.nativeElement.value = '';
		if (this.collectionTable.paginator) {
			this.collectionTable.paginator.firstPage();
		}
	}

	focusFilterInput() {
		if (window.innerWidth < 890) {
			this.showCollectionName = false;
		}
	}

	blurFilterInput() {
		this.showCollectionName = true;
	}

	resetSelected() {
		this.selectedDmoInCollection = null;
	}

	toggleSearchContainer(event: any) {
		(event.target as HTMLInputElement).value = '';
		this.showSearchContainer = !this.showSearchContainer;
	}

	trimComment(comment: string): string {
		if (!comment || !comment?.length) {
			return comment;
		}

		if (window.innerWidth > 1200) {
			return comment;
		}

		if (window.innerWidth < 860 && comment.length > 50) {
			return comment.substring(0, 10) + '...';
		}

		if (window.innerWidth < 860 && comment.length > 40) {
			return comment.substring(0, 20) + '...';
		}

		if (window.innerWidth > 860 && comment.length > 50) {
			return comment.substring(0, 40) + '...';
		}

		if (comment.length < 50) {
			return comment;
		}

		return comment.substring(0, 47) + '...';
	}

	private redirectAfterRemove() {
		this.currentSidebarService.setMenu(null);
		this.router.navigateByUrl('/app');
	}

	private loadDmos(collectionId: string) {
		this.resetCollectionTable();
		this.loadDmosSub = this.dmoCollectionService.getWithDmos(collectionId)
			.subscribe({
				next: (response: DmoCollectionDto) => {
					this.currentDmoCollection = response;
					this.initializeCollectionTable(this.currentDmoCollection.dmos);
				}
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
		this.collectionTableColumn = ['movieTitle', 'shortComment'];
		this.collectionTable = new MatTableDataSource(dataSource);
		this.collectionTable.paginator = this.collectionPaginator;
		this.collectionTable.sort = this.collectionSorter;
		this.collectionLength = this.currentDmoCollection.dmos.length;
		this.shouldCollectionShowTable = true;
	}
}
