import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmoComponent } from './dmo.component';

const routes: Routes = [
  { path: '', component: DmoComponent }
];

@NgModule({
  declarations: [DmoComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DmoModule { }
