import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityComponent } from './community.component';
import { RouterModule, Routes } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SharedModule } from 'src/app/shared/shared.module';
import { DmoEditorReadonlyComponent } from './components/dmo-editor-readonly/dmo-editor-readonly.component';
import { BeatsFlowReadonlyComponent } from './components/beats-flow-readonly/beats-flow-readonly.component';
import { PlotPointsFlowReadonlyComponent } from './components/plot-points-flow-readonly/plot-points-flow-readonly.component';

const routes: Routes = [
	{ path: '', component: CommunityComponent },
	{ path: 'dmo', component: DmoEditorReadonlyComponent }
];

@NgModule({
	declarations: [
		CommunityComponent,
		DmoEditorReadonlyComponent,
		BeatsFlowReadonlyComponent,
		PlotPointsFlowReadonlyComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		MatTableModule,
        MatPaginatorModule,
		SharedModule
	]
})
export class CommunityModule { }
