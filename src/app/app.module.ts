import { Toastr } from './shared/services/toastr.service';
import { AuthInterceptor } from './shared/services/auth.interceptor';
import { UserManager } from './shared/services/user-manager';
import { AuthService } from './shared/services/auth.service';
import { AuthGuard } from './shared/services/auth.guards';
import { Routes, RouterModule, RouteReuseStrategy } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ToastrModule, ToastrService } from 'ngx-toastr';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';
import { AuthGuardForChild } from './shared/services/auth.guard-for-child';

import { SocialLoginModule, SocialAuthServiceConfig } from 'angularx-social-login';
import { GoogleLoginProvider } from 'angularx-social-login';
import { environment } from 'src/environments/environment';
import { ToastrWrapperComponent } from './shared/components/toastr-wrapper/toastr-wrapper.component';
import { EditorRouteReuseStrategyService } from './shared/services/editor-route-reuse-strategy.service';
import { NnaMatPaginatorService } from './shared/services/nna-mat-paginator.service';
import { MatPaginatorIntl } from '@angular/material/paginator';

const routes: Routes = [
	{ path: 'app', loadChildren: () => import('./layout/layout.module').then(m => m.LayoutModule) },
	{ path: 'login', loadChildren: () => import('./login/login.module').then(m => m.LoginModule) },
	{ path: 'signup', loadChildren: () => import('./signup/signup.module').then(m => m.SignupModule) },
	{ path: 'email', loadChildren: () =>  import('./mail-form/mail-form.module').then(m => m.MailFormModule) }, 
	{ path: 'password', loadChildren: () =>  import('./password/password.module').then(m => m.PasswordModule)},
	{ path: 'account', loadChildren: () =>  import('./confirm-account/confirm-account.module').then(m => m.ConfirmAccountModule)},
	{ path: 'access-denied', loadChildren: () => import('./access-denied/access-denied.module').then(m => m.AccessDeniedModule) },
	{ path: 'not-found', loadChildren: () => import('./not-found/not-found.module').then(m => m.NotFoundModule) },
	{ path: '', loadChildren: () => import('./home/home.module').then(m => m.HomeModule) },
	{ path: '**', redirectTo: 'not-found' }
];

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
		BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
		BrowserAnimationsModule,
		ToastrModule.forRoot({ 
			preventDuplicates: true, 
			countDuplicates: true,
			tapToDismiss: false,
			positionClass: 'toast-bottom-right', 
			toastClass: '', 
			toastComponent: ToastrWrapperComponent,
			maxOpened: 4
		}),
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		NgbDropdownModule,
		NgbModule,
		SocialLoginModule
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
		{ provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: { disabled: true } },
		UserManager, ToastrService, Toastr,
		AuthGuardForChild, AuthGuard, AuthService,
		{	
			provide: 'SocialAuthServiceConfig',
			useValue: {
				autoLogin: false,
				providers: [{
					id: GoogleLoginProvider.PROVIDER_ID,
					provider: new GoogleLoginProvider(environment.google_client_id, { scope: 'profile email' })
				}]
			} as SocialAuthServiceConfig,
		},
		{ provide: MatPaginatorIntl, useClass: NnaMatPaginatorService },
		{ provide: RouteReuseStrategy, useClass: EditorRouteReuseStrategyService }
	],
  	bootstrap: [AppComponent],
})
export class AppModule { }
