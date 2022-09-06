import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
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

const routes: Routes = [
  { path: '', component: DmoEditor }
];

@NgModule({
  entryComponents: [DmoEditorPopupComponent, NnaSpinnerComponent],
  declarations: [DmoEditor, BeatsFlowComponent, PlotPointsFlowComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatDialogModule,
    MatTabsModule,
    SharedModule
  ]
})
export class DmoEditorModule { }
