import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

import { DashboardComponent } from './dashboard.component';
import { NnaSpinnerComponent } from 'src/app/shared/components/nna-spinner/nna-spinner.component';
import { SharedModule } from 'src/app/shared/shared.module';

const routes: Routes = [
    { path: '', component: DashboardComponent }
];

@NgModule({
    imports: [
        CommonModule,
        NgbCarouselModule,
        NgbAlertModule,
        RouterModule.forChild(routes),
        SharedModule
    ],
    declarations: [
        DashboardComponent
    ],
    entryComponents: [NnaSpinnerComponent]
})
export class DashboardModule {}
