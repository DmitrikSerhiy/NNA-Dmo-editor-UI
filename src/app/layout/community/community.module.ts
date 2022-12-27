import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityComponent } from './community.component';
import { RouterModule, Routes } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SharedModule } from 'src/app/shared/shared.module';

const routes: Routes = [
	{ path: '', component: CommunityComponent }
];

@NgModule({
	declarations: [
		CommunityComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		MatTableModule,
        MatPaginatorModule,
		SharedModule
	]
})
export class ComunityModule { }
