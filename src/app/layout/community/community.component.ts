import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableDataSourcePageEvent } from '@angular/material/table';
import { Subscription } from 'rxjs/internal/Subscription';
import { PaginationDetailsResultDto, PublishedDmosDto, PublishedDmoShortDto } from '../models';
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

	loadedDmos: any[] = [];
	currentPagination: PaginationDetailsResultDto;

	columns: string[];
	source: MatTableDataSource<PublishedDmoShortDto>
	selectedDmo: PublishedDmoShortDto;
	@ViewChild('paginator') paginator: MatPaginator;



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
	}

	onPaginateChange($event: MatTableDataSourcePageEvent): void {
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

	resetSelected() {
		this.selectedDmo = null;
	}

	onRowSelect(row: any): void {
		if (this.selectedDmo && this.selectedDmo === row) {
			this.selectedDmo = null;
			return;
		}
		this.selectedDmo = row;
	}


	private setDmosTable(loadedDmos: PublishedDmoShortDto[]) {
		this.source.data = loadedDmos;
	}

}
