import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmoEditorComponent as DmoEditor } from './dmo-editor.component';
import { BeatsFlowComponent } from './components/beats-flow/beats-flow.component';
import { PlotPointsFlowComponent } from './components/plot-points-flow/plot-points-flow.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NnaSpinnerComponent } from 'src/app/shared/components/nna-spinner/nna-spinner.component';
import { DmoEditorPopupComponent } from '../dmo-editor-popup/dmo-editor-popup.component';
import { CharactersPopupComponent } from './components/characters-popup/characters-popup.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

const routes: Routes = [
	{ path: '', component: DmoEditor, data: { shouldReuse: false } }
];

@NgModule({
  	entryComponents: [DmoEditorPopupComponent, NnaSpinnerComponent],
  	declarations: [DmoEditor, BeatsFlowComponent, PlotPointsFlowComponent, CharactersPopupComponent],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule.forChild(routes),
		MatDialogModule,
		MatTabsModule,
		SharedModule,
		FormsModule,
		MatRadioModule,
		MatTableModule,
		MatPaginatorModule,
		MatSortModule,
	]
})
export class DmoEditorModule { }
