import { RightMenuGrabberComponent } from './../shared/components/right-menu-grabber/right-menu-grabber.component';
import { SharedModule } from './../shared/shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { RemoveCollectionPopupComponent } from './../shared/components/remove-collection-popup/remove-collection-popup.component';
import { AuthGuard } from '../shared/services/auth.guards';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { LayoutComponent } from './layout.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';

import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DmoCollectionsComponent } from './dmo-collections/dmo-collections.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TestRightMenuComponent } from './test-right-menu/test-right-menu.component';
import { UserCabinetComponent } from './user-cabinet/user-cabinet.component';
import { DmoEditorPopupComponent } from './dmo-editor-popup/dmo-editor-popup.component';
import { TagsComponent } from './tags/tags.component';
import { TagDescriptionPopupComponent } from './tags/tag-description-popup/tag-description-popup.component';

const routes: Routes = [{
    path: '',
    component: LayoutComponent,
    children: [

        { path: 'dmos', loadChildren: () => import('./dmos/dmos.module').then(m => m.DmosModule), canActivate: [AuthGuard] },
        { path: 'editor', loadChildren: () =>import('./dmo-editor/dmo-editor.module').then(m => m.DmoEditorModule), canActivate: [AuthGuard] },
        { path: 'dmoCollection', loadChildren: () => import('./dmo-collection/dmo-collection.module').then(m => m.DmoCollectionModule), canActivate: [AuthGuard] },
        { path: 'comunity', loadChildren: () => import('./community/community.module').then(m => m.ComunityModule), canActivate: [AuthGuard] },
    ]}
];

@NgModule({
    declarations: [LayoutComponent, NavMenuComponent, SidebarComponent, DmoCollectionsComponent, TestRightMenuComponent, UserCabinetComponent, DmoEditorPopupComponent, DmoEditorPopupComponent, TagsComponent, TagDescriptionPopupComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        NgbDropdownModule,
        ReactiveFormsModule,
        MatSidenavModule,
        MatDialogModule,
        SharedModule
    ],
    entryComponents: [RemoveCollectionPopupComponent, RightMenuGrabberComponent]
})
export class LayoutModule { }
