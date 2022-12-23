import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { PublishedDmosDto, PublishedDmoShortDto } from '../models';
import { CommunityService } from './services/community.service';

@Component({
	selector: 'app-community',
	templateUrl: './community.component.html',
	styleUrls: ['./community.component.scss']
})
export class CommunityComponent implements OnInit, AfterViewInit, OnDestroy {

	pageSize: number = 10;
	pageNumber: number = 1;
	dmosSubscription: Subscription;

	loadedDmos: PublishedDmosDto;
	dmos: PublishedDmoShortDto[];
	filteredDmos: PublishedDmoShortDto[];



	constructor(private communityService: CommunityService) { }

	ngOnInit(): void {
		this.dmosSubscription = this.communityService.getPagedDmos(this.pageNumber, this.pageSize)
			.subscribe(result => {
				this.loadedDmos = result;
				this.dmos = this.loadedDmos.dmos;
				this.filteredDmos = this.loadedDmos.dmos;
			});
	}

	ngAfterViewInit(): void {

	}

	ngOnDestroy(): void {
		this.dmosSubscription?.unsubscribe();
	}

}
