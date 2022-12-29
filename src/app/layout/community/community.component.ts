import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableDataSourcePageEvent } from '@angular/material/table';
import { Subscription } from 'rxjs/internal/Subscription';
import { PaginationDetailsResultDto, PublishedDmoDetails, PublishedDmosDto, PublishedDmoShortDto } from '../models';
import { CommunityService } from './services/community.service';

@Component({
	selector: 'app-community',
	templateUrl: './community.component.html',
	styleUrls: ['./community.component.scss']
})
export class CommunityComponent implements OnInit, AfterViewInit, OnDestroy {

	pageSize: number = 10;
	currentPage: number = 0;
	dmosSubscription: Subscription;
	serverSideSearchAmoutSubsctiprion: Subscription;

	loadedDmos: any[] = [];
	loadedDmoDetails: PublishedDmoDetails[] = [];
	currentPagination: PaginationDetailsResultDto;

	columns: string[];
	source: MatTableDataSource<PublishedDmoShortDto>
	selectedDmo: PublishedDmoShortDto;
	selectedDmoDetails: PublishedDmoDetails;

	showSearchResultContainer: boolean = false;
	loadedDmosWhichFitSearch: PublishedDmoShortDto[] = [];

	serverSideSearchResult: number = 0;
	serverSideSearchPristine: boolean = true;

	
	@ViewChild('paginator') paginator: MatPaginator;
	@ViewChild('searchInput') searchInputElement: ElementRef;

	constructor(private communityService: CommunityService) { }

	ngOnInit(): void {

	}

	ngAfterViewInit(): void {
		this.dmosSubscription = this.communityService.getPagedDmos(this.currentPage, this.pageSize)
			.subscribe((result: PublishedDmosDto) => {
				this.columns = ['dmoDetails'];
				this.source = new MatTableDataSource();
				
				this.loadedDmos.push({ pageIndex: this.currentPage, data: result.dmos });
				this.currentPagination = result.pagination;
				this.source.paginator = this.paginator;
				this.setDmosTable(result.dmos);
			});
	}

	ngOnDestroy(): void {
		this.dmosSubscription?.unsubscribe();
		this.serverSideSearchAmoutSubsctiprion?.unsubscribe();
		this.loadedDmos = [];
		this.loadedDmoDetails = [];
	}

	onPaginateChange($event: MatTableDataSourcePageEvent): void {
		this.resetSelected();
		this.loadedDmosWhichFitSearch = [];
		this.showSearchResultContainer = false;
		this.searchInputElement.nativeElement.value = '';
		this.serverSideSearchResult = 0;
		this.serverSideSearchPristine = true;
		if (this.serverSideSearchAmoutSubsctiprion) {
			this.serverSideSearchAmoutSubsctiprion.unsubscribe();
		}


		if ($event.pageIndex < this.currentPage) {
			this.setDmosTable(this.loadedDmos.find(dmos => dmos.pageIndex == $event.pageIndex).data);
			this.currentPage = $event.pageIndex;
			return;
		}

		const previousPage = this.loadedDmos.find(dmos => dmos.pageIndex == $event.pageIndex);
		if (previousPage) {
			this.setDmosTable(previousPage.data);
			this.currentPage = $event.pageIndex;
			return;
		}

		this.dmosSubscription.unsubscribe();
		this.dmosSubscription = this.communityService.getPagedDmos($event.pageIndex, this.pageSize)
			.subscribe((result: PublishedDmosDto) => {
				this.loadedDmos.push({ pageIndex: $event.pageIndex, data: result.dmos });
				this.currentPagination = result.pagination;
				this.setDmosTable(result.dmos);
				this.currentPage = $event.pageIndex;
			});
	}

	resetSelected(): void {
		this.selectedDmo = null;
		this.selectedDmoDetails = null;
	}

	onRowSelect(row: any): void {
		this.loadedDmosWhichFitSearch = [];
		this.showSearchResultContainer = false;
		this.searchInputElement.nativeElement.value = '';
		this.serverSideSearchResult = 0;
		this.serverSideSearchPristine = true;
		if (this.serverSideSearchAmoutSubsctiprion) {
			this.serverSideSearchAmoutSubsctiprion.unsubscribe();
		}


		if (this.selectedDmo && this.selectedDmo === row) {
			this.selectedDmo = null;
			this.selectedDmoDetails = null;
			return;
		}

		const previouslyLoadedDetails = this.loadedDmoDetails.find(dmoDetails => dmoDetails.id == row.id);
		if (previouslyLoadedDetails) {
			this.selectedDmoDetails = previouslyLoadedDetails;
			this.selectedDmo = row;
			return;
		}

		this.communityService
			.getPublishedDmoDetails(row.id)
			.subscribe(dmoDetails => {
				this.loadedDmoDetails.push(dmoDetails);
				this.selectedDmoDetails = dmoDetails;
				this.selectedDmo = row;
			})
	}

	getPremiseWithQuestionMark(initialPremise: string): string {
		let trimmedPremise = initialPremise.trim();
		if (trimmedPremise.endsWith('?')) {
			return trimmedPremise;
		}
		return trimmedPremise + '?';		
	}

	openDmo(dmoIdToOpen: string): void {
		console.log(dmoIdToOpen);
	}

	

	localSearch($event: any): void {
		this.resetSelected();
		const searchValue = this.searchInputElement.nativeElement.value;
		if (!searchValue) {
			this.showSearchResultContainer = false;
			this.serverSideSearchResult = 0;
			this.serverSideSearchPristine = true;
			return;
		}

		this.loadedDmosWhichFitSearch = [];
		const searchValueLover = searchValue.toLowerCase();

		this.loadedDmos.forEach(loadedDmos => {
			loadedDmos.data.forEach((loadedDmo: PublishedDmoShortDto) => {
				if (loadedDmo.authorNickname.toLowerCase().includes(searchValueLover) ||
					loadedDmo.movieTitle.toLowerCase().includes(searchValueLover) ||
					loadedDmo?.name?.toLowerCase().includes(searchValueLover)) {
						this.loadedDmosWhichFitSearch.push(loadedDmo);
				}
			})
		});

		this.showSearchResultContainer = true;
	}

	serverSideSearch = this.debounceServerSideSearch(() => this.serverSideSearchSender());

	loadMoreDmosBySearch() {
		const searchValue = this.searchInputElement.nativeElement.value?.trim();
		if (!searchValue) {
			return;
		}

		if (this.serverSideSearchResult == 0) {
			return;
		}

		let excluededDmos: string[] = [];
		if (this.loadedDmosWhichFitSearch.length) {
			excluededDmos = this.loadedDmosWhichFitSearch.map(dmo => dmo.id);
		}

		this.communityService.getPublishedDmoBySearch(searchValue, excluededDmos, 0, this.pageSize, this.serverSideSearchResult)
			.subscribe(loadedSearchedResult => {
				console.log(loadedSearchedResult);
			});
	}

	focusSearch() : void {
		this.searchInputElement.nativeElement.focus();
	}

	private serverSideSearchSender() {
		const searchValue = this.searchInputElement.nativeElement.value?.trim();
		if (!searchValue) {
			return;
		}

		let excluededDmos: string[] = [];
		if (this.loadedDmosWhichFitSearch.length) {
			excluededDmos = this.loadedDmosWhichFitSearch.map(dmo => dmo.id);
		}
		
		this.serverSideSearchPristine = false; 
		if (this.serverSideSearchAmoutSubsctiprion) {
			this.serverSideSearchAmoutSubsctiprion.unsubscribe();
		}
		this.serverSideSearchAmoutSubsctiprion = this.communityService.getPublishedDmoAmountBySearch(searchValue, excluededDmos)
			.subscribe(searchResult => {
				this.serverSideSearchResult = searchResult;
			});
	}

	private debounceServerSideSearch(func, timeout = 500){
		let timer;
		return (...args) => {
		  	clearTimeout(timer);
		  	timer = setTimeout(() => { func.apply(this, args); }, timeout);
		};
	}



	private setDmosTable(loadedDmos: PublishedDmoShortDto[]) {
		this.source.data = loadedDmos;
	}

}
