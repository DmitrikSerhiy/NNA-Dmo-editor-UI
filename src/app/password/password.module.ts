import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordComponent } from './password.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  	declarations: [
    	PasswordComponent
  	],
  	imports: [
    	CommonModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		RouterModule.forChild([{
			path: '', component: PasswordComponent
		}])
  	]
})
export class PasswordModule { }
