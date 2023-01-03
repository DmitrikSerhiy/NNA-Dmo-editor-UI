import { MatDialogModule } from '@angular/material/dialog';
import { RemoveCollectionPopupComponent } from './components/remove-collection-popup/remove-collection-popup.component';
import { NgModule } from '@angular/core';
import { RightMenuGrabberComponent } from './components/right-menu-grabber/right-menu-grabber.component';
import { RemoveDmoPopupComponent } from './components/remove-dmo-popup/remove-dmo-popup.component';
import { NnaSpinnerComponent } from './components/nna-spinner/nna-spinner.component';
import { CustomErrorHandler } from './services/custom-error-handler';
import { SsoContainerComponent } from './components/sso-container/sso-container.component';
import { GoogleButtonComponent } from './components/google-button/google-button.component';
import { ToastrWrapperComponent } from './components/toastr-wrapper/toastr-wrapper.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { CharactersPopupComponent } from './components/characters-popup/characters-popup.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DmoDetailsPopupComponent } from './components/dmo-details-popup/dmo-details-popup.component';
import { MatTabsModule } from '@angular/material/tabs';


@NgModule({
	declarations: [
		RemoveCollectionPopupComponent,
		RightMenuGrabberComponent,
		RemoveDmoPopupComponent,
		NnaSpinnerComponent,
		SsoContainerComponent,
		GoogleButtonComponent,
		ToastrWrapperComponent,
		CharactersPopupComponent,
		DmoDetailsPopupComponent
	],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		MatTabsModule,
		MatDialogModule,
		MatRadioModule,
		MatCheckboxModule,
		MatTableModule,
		MatPaginatorModule,
		MatSortModule,
		MatSelectModule
	],
	exports: [
		RemoveCollectionPopupComponent,
		RightMenuGrabberComponent,
		NnaSpinnerComponent,
		SsoContainerComponent,
		GoogleButtonComponent,
		ToastrWrapperComponent,
		CharactersPopupComponent,
		DmoDetailsPopupComponent
	],
	providers: [CustomErrorHandler]
})
export class SharedModule { }
