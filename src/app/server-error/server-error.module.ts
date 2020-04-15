import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerErrorComponent } from './server-error.component';

@NgModule({
  declarations: [ServerErrorComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{
      path: '',
      component: ServerErrorComponent
  }])
  ]
})
export class ServerErrorModule { }
