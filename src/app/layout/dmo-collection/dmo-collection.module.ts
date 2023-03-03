import { SharedModule } from './../../shared/shared.module';
import { RemoveCollectionPopupComponent } from './../../shared/components/remove-collection-popup/remove-collection-popup.component';
import { Routes, RouterModule } from '@angular/router';
import { DmoCollectionComponent } from './dmo-collection.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AddDmosPopupComponent } from '../../shared/components/add-dmos-popup/add-dmos-popup.component';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthActiveUserGuard, AuthGuard } from 'src/app/shared/services/auth.guards';

const routes: Routes = [
    { path: '', component: DmoCollectionComponent, canActivate: [AuthGuard, AuthActiveUserGuard] }
];

@NgModule({
    imports: [
        CommonModule,
        NgbCarouselModule,
        NgbAlertModule,
        RouterModule.forChild(routes),
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        ReactiveFormsModule,
        FormsModule,
        MatCheckboxModule,
        MatDialogModule,
        SharedModule
    ],
    declarations: [
        DmoCollectionComponent,
        AddDmosPopupComponent
    ],
    entryComponents: [AddDmosPopupComponent, RemoveCollectionPopupComponent],
})
export class DmoCollectionModule {}
