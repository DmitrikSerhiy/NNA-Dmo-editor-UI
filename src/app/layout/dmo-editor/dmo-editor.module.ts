import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmoEditorComponent as DmoEditor } from './dmo-editor.component';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { PlotFlowComponent } from './components/plot-flow/plot-flow.component';

const routes: Routes = [
  { path: '', component: DmoEditor }
];

@NgModule({
  entryComponents: [InitialPopupComponent],
  declarations: [DmoEditor, InitialPopupComponent, PlotFlowComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatDialogModule,
    MatTabsModule
  ]
})
export class DmoEditorModule { }
