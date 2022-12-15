import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';
import { CachedTagsService } from 'src/app/shared/services/cached-tags.service';
import { NnaTagWithoutDescriptionDto } from '../models';

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

	
	constructor(private tagsService: CachedTagsService) { }


	async ngOnInit(): Promise<void> {
		this.rightMenuClsSubscription = this.rightMenuIsClosing$.subscribe(() => {
			// do some shit on close menu
		});
		this.rightMenuOpnSubscription = this.rightMenuIsOpening$.subscribe(() => {
			// do some shit on open menu
		});

		this.tags = await this.tagsService.getAllTags()


	}

	ngOnDestroy(): void {
		
	}


	async openTagDescription(tagId: string): Promise<void> {
		let result = await this.tagsService.getTagDescription(tagId);
		console.log(result);
		return;
	}

}
