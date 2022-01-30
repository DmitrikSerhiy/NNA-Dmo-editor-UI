import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MailFormComponent } from './mail-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  	declarations: [
    	MailFormComponent
  	],
  	imports: [
    	CommonModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		RouterModule.forChild([{
			path: '', component: MailFormComponent
		}])
  	]
})
export class MailFormModule { }
