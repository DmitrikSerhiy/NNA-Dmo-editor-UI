import { ShortDmoDto, ShortDmoDtoAPI } from '../../models';

import { UserManager } from '../../../shared/services/user-manager';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, share } from 'rxjs/operators';

import * as signalR from '@microsoft/signalr';
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack'
import { environment } from '../../../../environments/environment';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';
import { CustomErrorHandler } from 'src/app/shared/services/custom-error-handler';
import { CreateBeatDto, CreateBeatDtoAPI, NnaBeatDto, UpdateBeatDtoAPI, NnaDmoWithBeatsAsJson, NnaDmoWithBeatsAsJsonAPI, RemoveBeatDto, RemoveBeatDtoAPI, BeatToMoveDto, BeatsToSwapDto } from '../models/dmo-dtos';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Router } from '@angular/router';
import { Toastr } from 'src/app/shared/services/toastr.service';
import { ToastrErrorMessage } from 'src/app/shared/models/serverResponse';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class EditorHub {
    serverUrl = environment.server_user

    private readonly connectionStateEmit$: Subject<void> = new Subject<void>();

    public get failedResponseObject(): any {
        return { failed: true };
    }
    
    public isResponseFailed(response: any): boolean {
        return response?.failed;
    }

    private hubConnection: signalR.HubConnection;

    public get isConnected() : boolean {
        return this.hubConnection && this.hubConnection.state == signalR.HubConnectionState.Connected;
    }

    public get isReconnecting(): boolean {
        return this.hubConnection && (this.hubConnection.state == signalR.HubConnectionState.Connecting || this.hubConnection.state == signalR.HubConnectionState.Reconnecting);
    }

    public get isDisconnected(): boolean {
        return this.hubConnection && (this.hubConnection.state == signalR.HubConnectionState.Disconnected || this.hubConnection.state == signalR.HubConnectionState.Disconnecting);
    }

    get onConnectionChanged(): Observable<void>  {
        return this.connectionStateEmit$.asObservable().pipe(share());
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
        if (!this.userManager.isAuthorized()) {
            return;
        }

        if (this.isConnected) {
            return;
        }

        try {
            await this.authService.ping().toPromise();
        } catch (error) {
            this.router.navigate(["/login"]); 
            // todo: navigate to special error page
            this.userManager.clearUserData();
        }                

        this.buildConnection();
        await this.hubConnection.start();
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
        .withAutomaticReconnect()
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

        

        this.hubConnection.onreconnecting((error) => {
            this.connectionStateEmit$.next();
            console.log('Reconnecting...');
        });
        this.hubConnection.onreconnected(() => {
            this.connectionStateEmit$.next();
            console.log('Reconnected.');
        });
        this.hubConnection.onclose((error) => {
            this.connectionStateEmit$.next();
            if (error != null) {
                console.log('Closed after error.');
                if (error.message.includes("AuthenticationException: User already have active connection")) {
                    this.showNotConnectedError();
                }
            }
        });

        this.hubConnection.on("OnServerError", async (failedResponse: any) => {
            await this.abortConnection();
            this.showErrorsOrValidations(failedResponse);
        })
    
    }
    
    // ----- editor websocket methods ------

    async loadShortDmo(dmoId: string) : Promise<ShortDmoDto> {
        return await this.invokeSocketMethod<ShortDmoDto>('LoadShortDmo', { Id: dmoId });
    }

    async createDmo(dmo: ShortDmoDto) : Promise<ShortDmoDto> {
        return await this.invokeSocketMethod<ShortDmoDto>('CreateDmo', new ShortDmoDtoAPI(dmo));
    }

    async updateShortDmo(dmo: ShortDmoDto): Promise<void> {
        return await this.invokeSocketMethodWithoutResponseData('UpdateShortDmo', new ShortDmoDtoAPI(dmo));
    }

    async updateDmosJson(dmo: NnaDmoWithBeatsAsJson): Promise<void> {
        return await this.invokeSocketMethodWithoutResponseData('UpdateDmosJson', new NnaDmoWithBeatsAsJsonAPI(dmo));
    }

    async setBeatsId(dmoId: string): Promise<void> {
        return await this.invokeSocketMethodWithoutResponseData('SetBeatsId', { Id: dmoId });
    }

    async addBeat(beat: CreateBeatDto) {
        return await this.invokeSocketMethodWithoutResponseData('CreateBeat', new CreateBeatDtoAPI(beat));
    }

    async removeBeat(beat: RemoveBeatDto) {
        return await this.invokeSocketMethodWithoutResponseData('RemoveBeat', new RemoveBeatDtoAPI(beat));
    }

    async updateBeat(beat: NnaBeatDto) {
        return await this.invokeSocketMethodWithoutResponseData('UpdateBeat', new UpdateBeatDtoAPI(beat));
    }

    async swapBeats(beatsToSwapDto: BeatsToSwapDto) {
        return await this.invokeSocketMethodWithoutResponseData('SwapBeats', beatsToSwapDto);
    }

    // ----- editor websocket methods ------


    // ----- editor http methods --------

    initialBeatsLoadAsJson(dmoId: string): Observable<string> {
        return this.http
            .get<string>(this.serverUrl + 'beats/initial/json/' + dmoId)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<string>(response, obs)));
    }

    initialBeatsLoadBeatsAsArray(dmoId: string): Promise<NnaBeatDto[]> {
        return this.http
            .get<NnaBeatDto[]>(this.serverUrl + 'beats/initial/array/' + dmoId)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<NnaBeatDto[]>(response, obs)))
            .toPromise();
    }


    
    // ----- editor http methods --------


    private async invokeSocketMethod<TResponse>(methodName: string, params: any): Promise<TResponse> {
        if (!this.isConnected) {
            this.showNotConnectedError();
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
            this.showNotConnectedError();
            return;
        }
        
        try {
            await this.hubConnection.send(methodName, params );
            return Promise.resolve();
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
                this.toastr.showError(new ToastrErrorMessage(error.errorMessage, `${entry.message} ${entry.httpCode}`));
            });
            toastShowed = true;
		}

		if (entry.warnings != null && entry.warnings.length != 0) {
            let validations = [];
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

    private showNotConnectedError() {
        this.toastr.showError(new ToastrErrorMessage('Try to reconnect or to relogin', 'Editor was disconnected'));
    }

    private showUnverifiedSoketError() {
        this.toastr.showError(new ToastrErrorMessage('Administrator has been notified', 'Unverified socket error'));
    }

}
