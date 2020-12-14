import { PartialDmoUpdateDto, DmoDto, ShortDmoDto } from './../../models';

import { UserManager } from './../../../shared/services/user-manager';
import { Injectable } from '@angular/core';

import * as signalR from '@microsoft/signalr';
import { environment } from './../../../../environments/environment';
import { EditorResponseDto } from 'src/app/shared/models/editorResponseDto';

@Injectable({
  providedIn: 'root'
})
export class EditorHub {
    private hubConnection: signalR.HubConnection;
    public get isConnected() : boolean {
        return this.hubConnection && this.hubConnection.state == signalR.HubConnectionState.Connected
    }

    constructor(private userManager: UserManager) { 
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


    // ----- editor bub methods ------

    async partiallyUpdateDmo(dmoUpdate: PartialDmoUpdateDto) {
        if (!this.isConnected) {
            return;
        }
        await this.hubConnection.invoke('DmoUpdate', dmoUpdate);
    }

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
    // ----- editor bub methods ------
}
