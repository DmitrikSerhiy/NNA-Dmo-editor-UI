import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComunityComponent } from './comunity.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
	{ path: '', component: ComunityComponent }
];

@NgModule({
	declarations: [
		ComunityComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),

	]
})
export class ComunityModule { }
