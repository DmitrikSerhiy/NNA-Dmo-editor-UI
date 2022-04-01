import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { ConfirmAccountComponent } from './confirm-account.component';

@NgModule({
	declarations: [ConfirmAccountComponent],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		RouterModule.forChild([{
			path: '', component: ConfirmAccountComponent
		}])
	]
})
export class ConfirmAccountModule { }
