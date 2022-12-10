import { DmoDetailsDto, DmoDetailsShortDto } from '../../models';

import { UserManager } from '../../../shared/services/user-manager';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, share } from 'rxjs/operators';

import * as signalR from '@microsoft/signalr';
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack'
import { environment } from '../../../../environments/environment';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';
import { CustomErrorHandler } from 'src/app/shared/services/custom-error-handler';
import { CreateBeatDto, CreateBeatDtoAPI, NnaBeatDto, UpdateBeatDtoAPI, NnaDmoWithBeatsAsJson, NnaDmoWithBeatsAsJsonAPI, RemoveBeatDto, RemoveBeatDtoAPI, BeatsToSwapDto, DmoWithDataDto, AttachCharacterToBeatDtoAPI, DetachCharacterFromBeatDtoAPI, BeatToMoveDto } from '../models/dmo-dtos';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Router } from '@angular/router';
import { Toastr } from 'src/app/shared/services/toastr.service';
import { ToastrErrorMessage } from 'src/app/shared/models/serverResponse';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs/internal/Observable';
import { Operation } from 'fast-json-patch';

@Injectable({
  providedIn: 'root'
})
export class EditorHub {
    serverUrl = environment.server_user

    private readonly connectionStateEmit$: Subject<boolean> = new Subject<boolean>();

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

    get onConnectionChanged(): Observable<boolean>  {
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
        await this.hubConnection.stop();
    }

    private buildConnection() {
        this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(environment.server_user + 'editor', {
            accessTokenFactory: () => this.userManager.getAccessToken(),
            transport: signalR.HttpTransportType.WebSockets,
            logMessageContent: true,
            skipNegotiation: true })
        .withAutomaticReconnect([0, 2000, 2000, 2000, 2000, 2000])
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

        

        this.hubConnection.onreconnecting((error) => {
            this.connectionStateEmit$.next(false);
            console.log('Reconnecting...');
        });
        this.hubConnection.onreconnected(() => {
            this.connectionStateEmit$.next(true);
            console.log('Reconnected.');
        });
        this.hubConnection.onclose((error) => {
            this.connectionStateEmit$.next(false);
            if (error != null) {
                if (!error.message.includes("AuthenticationException: User already have active connection")) {
                    console.error(error.message);
                    this.showNotConnectedError();
                    return;
                }
            }
        });

        this.hubConnection.on("OnServerError", async (failedResponse: any) => {
            await this.abortConnection();
            this.showErrorsOrValidations(failedResponse);
        })
    
    }
    
    // ----- editor websocket methods ------

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

    async moveBeats(beatsToMove: BeatToMoveDto) {
        return await this.invokeSocketMethodWithoutResponseData('MoveBeat', beatsToMove);
    }

    async attachCharacterToBeat(id: string, dmoId: string, beatId: string, characterId: string) {
        return await this.invokeSocketMethodWithoutResponseData('AttachCharacterToBeat', new AttachCharacterToBeatDtoAPI(id, dmoId, beatId, characterId));
    }

    async detachCharacterFromBeat(id: string, dmoId: string, beatId: string) {
        return await this.invokeSocketMethodWithoutResponseData('DetachCharacterFromBeat', new DetachCharacterFromBeatDtoAPI(id, dmoId, beatId));
    }

    // ----- editor websocket methods ------


    // ----- editor http methods --------

    initialDmoLoadWithData(dmoId: string, sanitizeBeforeLoad: boolean): Promise<DmoWithDataDto> {
        return this.http
            .get<DmoWithDataDto>(this.serverUrl + 'dmos/' + dmoId + '/withData?sanitizeBeforeLoad=' + sanitizeBeforeLoad)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<DmoWithDataDto>(response, obs)))
            .toPromise();
    }

    getDmoDetailsShort(id: string): Promise<DmoDetailsShortDto> {
        return this.http
            .get<DmoDetailsShortDto>(this.serverUrl + 'dmos/short/' + id)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<DmoDetailsShortDto>(response, obs)))
            .toPromise();
    }

    getDmoDetails(id: string): Promise<DmoDetailsDto> {
        return this.http
            .get<DmoDetailsDto>(this.serverUrl + 'dmos/' + id)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<DmoDetailsDto>(response, obs)))
            .toPromise();
    }

    updateDmoDetails(id: string, update: Operation[]): Promise<void> {
        return this.http
            .patch<any>(this.serverUrl + 'dmos/' + id + '/details' , update)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<any>(response, obs)))
            .toPromise();
    }

    updateDmoPlotDetails(id: string, update: Operation[]): Promise<void> {
        return this.http
            .patch<any>(this.serverUrl + 'dmos/' + id + '/plot', update)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<any>(response, obs)))
            .toPromise();
    }

    createConflict(id: string, order: number): Promise<any> {
        return this.http
            .post<any>(this.serverUrl + 'dmos/' + id + '/conflict', {зairOrder: order })
            .pipe(catchError( (response, obs) => this.errorHandler.handle<any>(response, obs)))
            .toPromise();
    }
   
    deleteConflict(conflictPairId: string): Promise<void> {
        return this.http
            .delete<any>(this.serverUrl + 'dmos/dmo/conflictPair/' + conflictPairId)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<any>(response, obs)))
            .toPromise();
    }

    patchConflict(conflictId: string, update: Operation[]): Promise<void>  {
        return this.http
            .patch<any>(this.serverUrl + 'dmos/dmo/conflict/' + conflictId, update)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<any>(response, obs)))
            .toPromise();
    }

    sanitizeTempIds(dmoId: string): Promise<void> {
        return this.http
            .delete<void>(this.serverUrl + 'dmos/' + dmoId + '/tempIds')
            .pipe(catchError( (response, obs) => this.errorHandler.handle<void>(response, obs)))
            .toPromise();
    }
    
    // ----- editor http methods --------


    private async invokeSocketMethod<TResponse>(methodName: string, params: any): Promise<TResponse> {
        if (this.isReconnecting) {
            this.showConnectionReconnectionStatusMessage();
            return;
        }

        if (this.isDisconnected) {
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
        if (this.isReconnecting) {
            this.showConnectionReconnectionStatusMessage();
            return;
        }

        if (this.isDisconnected) {
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
		if (entry.errors != null && entry.errors.length != 0) {
			entry.errors.forEach(error => {
                this.toastr.showError(new ToastrErrorMessage(error.errorMessage, `${entry.message} ${entry.httpCode}`));
            });
            return;
		}

		if (entry.warnings != null && entry.warnings.length != 0) {
            let validations = [];
            entry.warnings.forEach(warning => {validations.push({ fieldName: warning.fieldName, validationMessage: warning.validationMessage} ) });
            this.toastr.showValidationMessageForEditor(validations, entry.message);
            return;
		}

        this.showUnverifiedSoketError();
	}

    private isResponseSuccessful(entry: EditorResponseDto) : boolean {
        if (!entry) {
			return false;
		}

		return entry.isSuccessful 
    }

    private showConnectionReconnectionStatusMessage() {
        this.toastr.warning(new ToastrErrorMessage('Connection was lost. Your progress is not saved.', 'Reconnecting...'));
    }

    private showNotConnectedError() {
        this.toastr.showError(new ToastrErrorMessage('Your progress is not saved. Try to reconnect manually.', 'Connection is not established'));
    }

    private showUnverifiedSoketError() {
        this.toastr.showError(new ToastrErrorMessage('Administrator has been notified.', 'Unverified socket error'));
    }

}
