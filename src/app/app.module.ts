import { Toastr } from './shared/services/toastr.service';
import { AuthInterceptor } from './shared/services/auth.interceptor';
import { UserManager } from './shared/services/user-manager';
import { AuthService } from './shared/services/auth.service';
import { AuthGuardForChild, AuthGuard } from './shared/services/auth.guards';
import { Routes, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ToastrModule, ToastrService } from 'ngx-toastr';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material';


const routes: Routes = [
  { path: 'login', loadChildren: () => import('./login/login.module').then(m => m.LoginModule) },
  { path: 'signup', loadChildren: () => import('./signup/signup.module').then(m => m.SignupModule) },
  { path: 'error', loadChildren: () => import('./server-error/server-error.module').then(m => m.ServerErrorModule) },
  { path: 'access-denied', loadChildren: () => import('./access-denied/access-denied.module').then(m => m.AccessDeniedModule) },
  { path: 'not-found', loadChildren: () => import('./not-found/not-found.module').then(m => m.NotFoundModule) },
  { path: '', loadChildren: () => import('./layout/layout.module').then(m => m.LayoutModule)},
  { path: '**', redirectTo: 'not-found' }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    BrowserAnimationsModule,
    ToastrModule.forRoot({preventDuplicates: true, countDuplicates: true}),
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: { disabled: true } },
    AuthGuardForChild, AuthGuard, AuthService, UserManager, ToastrService, Toastr],

  bootstrap: [AppComponent],
})
export class AppModule { }
