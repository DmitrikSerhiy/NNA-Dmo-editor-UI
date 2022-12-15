import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CachedTagsService } from 'src/app/shared/services/cached-tags.service';
import { NnaTagDto } from '../../models';

@Component({
	selector: 'app-tag-description-popup',
	templateUrl: './tag-description-popup.component.html',
	styleUrls: ['./tag-description-popup.component.scss']
})
export class TagDescriptionPopupComponent implements OnInit {

	tag: NnaTagDto;
	private tagId: string;

	constructor(
		private tagsService: CachedTagsService,
		private dialogRef: MatDialogRef<TagDescriptionPopupComponent>,
		@Inject(MAT_DIALOG_DATA) public data: string) {
			this.tagId = data;
		}

	async ngOnInit(): Promise<void> {
		this.dialogRef.backdropClick().subscribe(() => this.onClose());
		this.tag = await this.tagsService.getTag(this.tagId);
	}

	onClose() {
		this.dialogRef.close();
		return;
	}
}
