import { RemoveDmoPopupComponent } from './../../shared/components/remove-dmo-popup/remove-dmo-popup.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from './../../shared/shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { DmosComponent } from './dmos.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AuthActiveUserGuard, AuthGuard } from 'src/app/shared/services/auth.guards';

const routes: Routes = [
  { path: '', component: DmosComponent, canActivate: [AuthGuard, AuthActiveUserGuard] }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatDialogModule,
    SharedModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule
  ],
  declarations: [
    DmosComponent
  ],
  entryComponents: [RemoveDmoPopupComponent]
})

export class DmosModule { }
