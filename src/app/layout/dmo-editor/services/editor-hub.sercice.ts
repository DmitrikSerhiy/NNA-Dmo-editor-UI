import { UpdateDmoDetailsDto, DmoDto, ShortDmoDto } from './../../models';

import { UserManager } from './../../../shared/services/user-manager';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

import * as signalR from '@microsoft/signalr';
import { environment } from './../../../../environments/environment';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';
import { CustomErrorHandler } from 'src/app/shared/services/custom-error-handler';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorHub {
    serverUrl = environment.server_user
    private hubConnection: signalR.HubConnection;
    public get isConnected() : boolean {
        return this.hubConnection && this.hubConnection.state == signalR.HubConnectionState.Connected
    }

    constructor(
        private userManager: UserManager, 
        private http: HttpClient,
        private errorHandler: CustomErrorHandler) { 
        this.hubConnection = null;
    }

    async startConnection() {
        if (this.userManager.isAuthorized) {
            if(this.hubConnection != null && this.hubConnection.state != 'Disconnected') {
                return;
            }
            this.createConnection();
            await this.hubConnection.start();
        }
    }

    async abortConnection() {
        if (!this.isConnected) {
            return;
        }

        await this.hubConnection.stop();
    }

    private createConnection() {
        this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(environment.server_user + 'editor', {
            accessTokenFactory: () => this.userManager.getJWT(), // todo: request refresh token if expired
            transport: signalR.HttpTransportType.WebSockets,
            logMessageContent: true,
            skipNegotiation: true })
        // .configureLogging(signalR.LogLevel.Trace)  //uncomment for testing
        .withAutomaticReconnect()
        .build();


        this.hubConnection.onreconnecting((error) => {
            if (error != null) {
                console.error(error);
            } else {
                // todo: show orange reconnecting status;
                console.log('Reconnecting...');
            }
        });
        this.hubConnection.onreconnected(() => {
            //todo: show green reconnected status;
            console.log('Reconnected.');
        });
        this.hubConnection.onclose((error) => {
            if (error != null) {
                console.error(error);
            }
            // todo: show red reconnected status;
        });
    }


    // ----- editor websocket methods ------

    async loadShortDmo(dmoId: string) : Promise<EditorResponseDto> {
        if (!this.isConnected) {
            return;
        }
        try {
            var response = await this.hubConnection.invoke('LoadShortDmo', { id: dmoId } );
            return Promise.resolve<EditorResponseDto>(response);
        } catch (err) {
            Promise.reject(err)
        }
    }

    async createDmo(dmo: ShortDmoDto) : Promise<EditorResponseDto> {
        if (!this.isConnected) {
            return;
        }
        try {
            var response = await this.hubConnection.invoke('CreateDmo', dmo);
            return Promise.resolve<EditorResponseDto>(response);
        } catch (err) {
            Promise.reject(err)
        }
    }

    async updateShortDmo(dmo: ShortDmoDto): Promise<EditorResponseDto> {
        if (!this.isConnected) {
            return;
        }
        try {
            var response = await this.hubConnection.invoke('UpdateShortDmo', dmo);
            return Promise.resolve<EditorResponseDto>(response);
        } catch (err) {
            return Promise.reject(err);
        }
    }
    // ----- editor websocket methods ------


    // ----- editor http methods --------
    initialBeatsLoad(dmoId: string): Observable<string> {
        return this.http
            .get(this.serverUrl + 'beats/initial/' + dmoId)
            .pipe(
                map((response: string) => response),
                catchError(this.errorHandler.handle));
    }


    // ----- editor http methods --------
}
