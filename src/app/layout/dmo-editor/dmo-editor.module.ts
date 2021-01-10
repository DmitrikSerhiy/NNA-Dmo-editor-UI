import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmoEditorComponent as DmoEditor } from './dmo-editor.component';
import { InitialPopupComponent } from './components/initial-popup/initial-popup.component';
import { PlotFlowComponent } from './components/plot-flow/plot-flow.component';
import { TimePickerComponent } from './components/time-picker/time-picker.component';
import { PlotPointComponent } from './components/plot-point/plot-point.component';
import { PlotPointDirective } from './directives/plot-point.directive';
import { BeatContainerComponent } from './components/beat-container/beat-container.component';

const routes: Routes = [
  { path: '', component: DmoEditor }
];

@NgModule({
  entryComponents: [InitialPopupComponent, PlotPointComponent],
  declarations: [DmoEditor, InitialPopupComponent, PlotFlowComponent, TimePickerComponent, PlotPointComponent, PlotPointDirective, BeatContainerComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatDialogModule,
    MatTabsModule
  ]
})
export class DmoEditorModule { }
