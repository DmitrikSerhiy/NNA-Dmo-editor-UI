import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmoEditorComponent as DmoEditor } from './dmo-editor.component';

const routes: Routes = [
  { path: '', component: DmoEditor }
];

@NgModule({
  declarations: [DmoEditor],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DmoEditorModule { }
