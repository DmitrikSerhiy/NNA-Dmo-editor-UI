import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, QueryList } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BeatGeneratorService } from 'src/app/layout/dmo-editor/helpers/beat-generator';
import { NnaDmoDto } from 'src/app/layout/dmo-editor/models/dmo-dtos';
import { EditorHub } from 'src/app/layout/dmo-editor/services/editor-hub.service';
import { DmoDetailsShortDto } from 'src/app/layout/models';
import { NnaTooltipService } from 'src/app/shared/services/nna-tooltip.service';

@Component({
	selector: 'app-dmo-editor-readonly',
	templateUrl: './dmo-editor-readonly.component.html',
	styleUrls: ['./dmo-editor-readonly.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DmoEditorReadonlyComponent implements OnInit, AfterViewInit, OnDestroy {

	isDmoInfoSet: boolean = false;
	beatsLoading: boolean = true;
	dmoId: string;
	currentShortDmo: DmoDetailsShortDto;
	initialDmoDto: NnaDmoDto;
	showControlPanel: boolean = false;
	isDmoFinised: boolean;
	beatWasSet: boolean = false;

	plotPointsWithMetaData: any[] = [];
	beatElements: QueryList<ElementRef> = new QueryList<ElementRef>()
	beatsMetaData: any[] = [];
	beatsIds: string[] = [];

	// todo: fix delete dmo if it contains conflicts
	// todo: fix order on sanitization 
	
	constructor(
		private cdRef: ChangeDetectorRef,
		private editorHub: EditorHub,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		public matModule: MatDialog,
		private nnaTooltipService: NnaTooltipService,
		private dataGenerator: BeatGeneratorService,
		) { }

	ngOnInit(): void {
		this.activatedRoute.queryParams.subscribe((params) => {
			this.dmoId = params['dmoId'];
			this.cdRef.detectChanges();
		});
		
		document.addEventListener('keydown', this.hideAllTooltipsWrapper);
	}

	async ngAfterViewInit(): Promise<void> {
		this.currentShortDmo = await this.editorHub.getDmoDetailsShort(this.dmoId);
		this.isDmoFinised = this.currentShortDmo.dmoStatusId === 1;
		this.isDmoInfoSet = true
		this.showControlPanel = true;
		this.cdRef.detectChanges();

		const dmoWithData = await this.editorHub.initialDmoLoadWithData(this.dmoId, true);
		this.initialDmoDto = new NnaDmoDto(this.dmoId);
		if (!dmoWithData?.beats?.length) {
			this.initialDmoDto.beats.push(this.dataGenerator.createNnaBeatWithDefaultData());
		} else {
			this.initialDmoDto.beats = dmoWithData.beats;
		}

		this.initialDmoDto.characters = dmoWithData.characters;
		this.beatsLoading = false;
		this.cdRef.detectChanges();
	}

	ngOnDestroy(): void {
		document.removeEventListener('keydown', this.hideAllTooltipsWrapper);
		this.clearData();
		this.dmoId = '';
		this.cdRef.detectChanges();
	}

	async openDmoDetails() {
		this.nnaTooltipService.hideAllTooltips();
		this.cdRef.detectChanges();

		// const dmoDetailsPopup = this.matModule.open(DmoDetailsPopupComponent, { data: this.dmoId, width: '600px' });
		// await dmoDetailsPopup.afterClosed().toPromise();
	}

	async openCharactersPopup($event: any = null): Promise<void> {
		this.nnaTooltipService.hideAllTooltips();
		await this.finalizeCharactersPopup($event);
	}

	async beatsSet(callbackResult: any): Promise<void> {
		this.beatElements = callbackResult.beats;
		this.beatsMetaData = callbackResult.beatMetadata;
		this.beatsIds = callbackResult.beatsIds;
		this.plotPointsWithMetaData = this.beatElements.map((beatElement, i) => { return {beatId: this.beatsIds[i], beatType: beatElement.nativeElement.dataset.beatType, plotPointMetaData: this.beatsMetaData[i], order: i} }); 

		this.plotPointsWithMetaData = this.beatElements.map((beatElement, i) => { return {beatId: this.beatsIds[i], beatType: beatElement.nativeElement.dataset.beatType, plotPointMetaData: this.beatsMetaData[i], order: i} }); 
		this.beatWasSet = true;
		this.cdRef.detectChanges();
	}

	private async finalizeCharactersPopup(openOnAction: any): Promise<void> {
		// let characterBeats = this.selectBeatDtos();
		// characterBeats = characterBeats.filter(beat => beat.type == 3);
		// const popupResult = await this.matModule
		// 	.open(CharactersPopupComponent, { data: { dmoId: this.dmoId, beats: characterBeats, openOnAction: openOnAction }, width: '600px' })
		// 	.afterClosed()
		// 	.toPromise();
		// this.cdRef.detectChanges();

	}

	private hideAllTooltipsWrapper = async function($event) {
		const key = $event.which || $event.keyCode || $event.charCode;
		if (key == 27) { // escape
			this.nnaTooltipService.hideAllTooltips();
		}	
	}.bind(this);

	closeEditor(): void {
		this.router.navigate(['app/community']);
	}

	private clearData(): void {
		this.clearBeatsAndCharacters();
		this.clearDmoDetails();
	}

	private clearBeatsAndCharacters(): void {
		this.beatWasSet = false;
		this.beatsLoading = true;
		this.initialDmoDto = null;
		this.nnaTooltipService.hideAllTooltips();
		this.cdRef.detectChanges();
	}

	private clearDmoDetails(): void {
		this.showControlPanel = false;
		this.isDmoInfoSet = false;
		this.currentShortDmo = null;
		this.matModule.closeAll();
		this.cdRef.detectChanges();
	}
}