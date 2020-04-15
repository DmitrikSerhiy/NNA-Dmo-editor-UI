import { MatDialogModule } from '@angular/material/dialog';
import { RemoveCollectionPopupComponent } from './components/remove-collection-popup/remove-collection-popup.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RightMenuGrabberComponent } from './components/right-menu-grabber/right-menu-grabber.component';
import { RemoveDmoPopupComponent } from './components/remove-dmo-popup/remove-dmo-popup.component';

@NgModule({
  declarations: [RemoveCollectionPopupComponent, RightMenuGrabberComponent, RemoveDmoPopupComponent],
  imports: [
    CommonModule,
    MatDialogModule
  ],
  exports: [RemoveCollectionPopupComponent, RightMenuGrabberComponent]
})
export class SharedModule { }
