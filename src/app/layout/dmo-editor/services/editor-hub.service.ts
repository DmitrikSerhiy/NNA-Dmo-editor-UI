import { ShortDmoDto } from '../../models';

import { UserManager } from '../../../shared/services/user-manager';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';
import { CustomErrorHandler } from 'src/app/shared/services/custom-error-handler';
import { Observable } from 'rxjs';
import { NnaDmoWithBeatsAsJson } from '../models/dmo-dtos';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Router } from '@angular/router';
import { Toastr } from 'src/app/shared/services/toastr.service';
import { EditorValidationMessage, ToastrErrorMessage } from 'src/app/shared/models/serverResponse';

@Injectable({
  providedIn: 'root'
})
export class EditorHub {
    serverUrl = environment.server_user

    public get failedResponseObject(): any {
        return { failed: true };
    }
    
    public isResponseFailed(response: any): boolean {
        return response?.failed;
    }

    private hubConnection: signalR.HubConnection;
    public get isConnected() : boolean {
        return this.hubConnection && this.hubConnection.state == signalR.HubConnectionState.Connected
    }

    constructor(
        private userManager: UserManager, 
        private authService: AuthService,
        private router: Router, 
        private http: HttpClient,
        private errorHandler: CustomErrorHandler,
        private toastr: Toastr) { 
            this.hubConnection = null;
    }

    async startConnection() {
        if (this.userManager.isAuthorized) {
            if(this.hubConnection != null && this.hubConnection.state != 'Disconnected') {
                return;
            }

            try {
                await this.authService.ping().toPromise();
            } catch (error) {
                this.router.navigate(["/login"]); 
                this.userManager.clearUserData();
            }                

            this.buildConnection();
            await this.hubConnection.start();
        }
    }

    async abortConnection() {
        if (!this.isConnected) {
            return;
        }

        await this.hubConnection.stop();
    }

    private buildConnection() {
        this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(environment.server_user + 'editor', {
            accessTokenFactory: () => this.userManager.getAccessToken(),
            transport: signalR.HttpTransportType.WebSockets,
            logMessageContent: true,
            skipNegotiation: true })
        // .configureLogging(signalR.LogLevel.Trace)  // uncomment for testing
        .withAutomaticReconnect()
        .build();

        

        this.hubConnection.onreconnecting((error) => {
            console.log('Reconnecting...');
            if (error != null) {
                console.log(error);
            }
        });
        this.hubConnection.onreconnected(() => {
            console.log('Reconnected.');
        });
        this.hubConnection.onclose((error) => {
            if (error != null) {
                console.log('failed');
            }
        });
    
    }
    
    // ----- editor websocket methods ------

    async loadShortDmo(dmoId: string) : Promise<ShortDmoDto> {
        return await this.invokeSocketMethod<ShortDmoDto>('LoadShortDmo', { id: dmoId });
    }

    async createDmo(dmo: ShortDmoDto) : Promise<ShortDmoDto> {
        return await this.invokeSocketMethod<ShortDmoDto>('CreateDmo', dmo);
    }

    async updateShortDmo(dmo: ShortDmoDto): Promise<any> {
        return await this.invokeSocketMethodWithoutResponseData('UpdateShortDmo', dmo);
    }

    async updateDmosJson(dmo: NnaDmoWithBeatsAsJson): Promise<any> {
        return await this.invokeSocketMethodWithoutResponseData('UpdateDmosJson', dmo);
    }

    // ----- editor websocket methods ------


    // ----- editor http methods --------

    initialBeatsLoad(dmoId: string): Observable<string> {
        return this.http
            .get<string>(this.serverUrl + 'beats/initial/' + dmoId)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<string>(response, obs)));
    }

    // ----- editor http methods --------


    private async invokeSocketMethod<TResponse>(methodName: string, params: any): Promise<TResponse> {
        if (!this.isConnected) {
            return;
        }
        
        try {
            var response = await this.hubConnection.invoke(methodName, params );
            if (this.isResponseSuccessful(response)) {
                return Promise.resolve<TResponse>(response.data);
            }

            this.showErrorsOrValidations(response);
            return Promise.resolve(null);  
        } catch (failedResponse) {
            await this.abortConnection();
            this.showErrorsOrValidations(failedResponse);
            return Promise.resolve(null);   
        }
    }

    private async invokeSocketMethodWithoutResponseData(methodName: string, params: any): Promise<void> {
        if (!this.isConnected) {
            return;
        }
        
        try {
            var response = await this.hubConnection.invoke(methodName, params );
            if (this.isResponseSuccessful(response)) {
                return Promise.resolve()
            }

            this.showErrorsOrValidations(response);
            return Promise.resolve(this.failedResponseObject);  
        } catch (failedResponse) {
            await this.abortConnection();
            this.showErrorsOrValidations(failedResponse);
            return Promise.resolve(this.failedResponseObject);   
        }
    }

    private showErrorsOrValidations(entry: EditorResponseDto) {
        let toastShowed: boolean = false;
		if (entry.errors != null && entry.errors.length != 0) {
			entry.errors.forEach(error => {
                console.log(entry);
                this.toastr.showError(new ToastrErrorMessage(error.errorMessage, `${entry.message} ${entry.httpCode}`));
            });
            toastShowed = true;
		}

		if (entry.warnings != null && entry.warnings.length != 0) {
            let validations = [];
            console.log(entry);
            entry.warnings.forEach(warning => {validations.push({ fieldName: warning.fieldName, validationMessage: warning.validationMessage} ) });
            this.toastr.showValidationMessageForEditor(validations, entry.message);
            toastShowed = true;
		}

        if (toastShowed == false) {
            this.showUnverifiedSoketError();
        }
	}

    private isResponseSuccessful(entry: EditorResponseDto) : boolean {
        if (!entry) {
			return false;
		}

		return entry.isSuccessful 
    }

    private showUnverifiedSoketError() {
        this.toastr.showError(new ToastrErrorMessage('Administrator has been notified', 'Unverified socket error'));
    }

}
