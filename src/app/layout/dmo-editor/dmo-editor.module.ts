import { MatTabsModule } from '@angular/material/tabs';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { DmoEditorComponent as DmoEditor } from './dmo-editor.component';
import { BeatsFlowComponent } from './components/beats-flow/beats-flow.component';
import { PlotPointsFlowComponent } from './components/plot-points-flow/plot-points-flow.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NnaSpinnerComponent } from 'src/app/shared/components/nna-spinner/nna-spinner.component';
import { DmoEditorPopupComponent } from '../dmo-editor-popup/dmo-editor-popup.component';
import { CharactersPopupComponent } from '../../shared/components/characters-popup/characters-popup.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { DmoDetailsPopupComponent } from '../../shared/components/dmo-details-popup/dmo-details-popup.component';
import { PublishDmoPopupComponent } from './components/publish-dmo-popup/publish-dmo-popup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const routes: Routes = [
	{ path: '', component: DmoEditor, data: { shouldReuse: false } }
];

@NgModule({
  	entryComponents: [DmoEditorPopupComponent, NnaSpinnerComponent, CharactersPopupComponent, DmoDetailsPopupComponent],
  	declarations: [DmoEditor, BeatsFlowComponent, PlotPointsFlowComponent, PublishDmoPopupComponent],
	imports: [
		CommonModule,
		FormsModule,
		SharedModule,
		ReactiveFormsModule,
		RouterModule.forChild(routes),
		MatTabsModule,
		MatDialogModule,
		MatRadioModule,
		MatCheckboxModule,
		MatTableModule,
		MatPaginatorModule,
		MatSortModule,
		MatSelectModule
	]
})
export class DmoEditorModule { }
