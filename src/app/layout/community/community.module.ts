import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityComponent } from './community.component';
import { RouterModule, Routes } from '@angular/router';

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

	]
})
export class ComunityModule { }
