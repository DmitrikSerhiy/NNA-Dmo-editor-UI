import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';
import { CachedTagsService } from 'src/app/shared/services/cached-tags.service';
import { NnaTagWithoutDescriptionDto } from '../models';
import { TagDescriptionPopupComponent } from './tag-description-popup/tag-description-popup.component';

@Component({
	selector: 'app-tags',
	templateUrl: './tags.component.html',
	styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit, OnDestroy {


	@Input() rightMenuIsClosing$: Observable<void>;
	@Input() rightMenuIsOpening$: EventEmitter<void>;
	@Output() closeRightMenu = new EventEmitter<void>();

	private rightMenuOpnSubscription: Subscription;
	private rightMenuClsSubscription: Subscription;

	tags: NnaTagWithoutDescriptionDto[];
	filtredTags: NnaTagWithoutDescriptionDto[];

	@ViewChild('tagNameSearch') tagSearchInputElement: ElementRef;
	
	constructor(
		private matModule: MatDialog,
		private tagsService: CachedTagsService) { }


	async ngOnInit(): Promise<void> {
		this.rightMenuClsSubscription = this.rightMenuIsClosing$.subscribe(() => {
			this.resetSearchInput();
		});
		this.rightMenuOpnSubscription = this.rightMenuIsOpening$.subscribe(() => {
			// do some shit on open menu
		});

		this.tags = await this.tagsService.getAllTags()
		this.filtredTags = [...this.tags];

	}

	ngOnDestroy(): void {
		this.rightMenuOpnSubscription?.unsubscribe();
		this.rightMenuClsSubscription?.unsubscribe();
		this.resetSearchInput();
	}

	filterTags(): void {
		if (!this.tagSearchInputElement.nativeElement.value?.length) {
			this.resetSearchInput();
		}

		this.filtredTags = this.tags.filter(tag => tag.name.toLocaleLowerCase().includes(this.tagSearchInputElement.nativeElement.value.toLocaleLowerCase()))
	}


	async openTagDescription(tagId: string): Promise<void> {
		await this.matModule
			.open(TagDescriptionPopupComponent, { data: tagId, width: '400px' })
			.afterClosed()
			.toPromise();
	}

	private resetSearchInput(): void {
		this.filtredTags = [...this.tags];
		if (this.tagSearchInputElement) {
			this.tagSearchInputElement.nativeElement.value = '';
		}
	}
}
