import { PartialDmoUpdateDto, DmoDto, ShortDmoDto } from './../../models';

import { UserManager } from './../../../shared/services/user-manager';
import { Injectable } from '@angular/core';

import * as signalR from '@microsoft/signalr';
import { environment } from './../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EditorHub {
    private hubConnection: signalR.HubConnection;
    public get isConnected() : boolean {
        return this.hubConnection && this.hubConnection.state == signalR.HubConnectionState.Connected
    }
    

    constructor(private userManager: UserManager) { }

    async startConnection() {
        if (this.userManager.isAuthorized) {
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
        .configureLogging(signalR.LogLevel.Trace)
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


    async partiallyUpdateDmo(dmoUpdate: PartialDmoUpdateDto) {
        if (!this.isConnected) {
            return;
        }
        await this.hubConnection.invoke('DmoUpdate', dmoUpdate);
    }

    async loadDmo(dmoId: string): Promise<DmoDto> {
        if (!this.isConnected) {
            return;
        }
        try {
            return await this.hubConnection.invoke('LoadDmo', dmoId);
        } catch (err) {
            return Promise.reject();
        }
    }

    async createDmo(dmo: ShortDmoDto): Promise<ShortDmoDto> {
        if (!this.isConnected) {
            return;
        }
        try {
            return await this.hubConnection.invoke('CreateDmo', dmo);
        } catch (err) {
            return Promise.reject();
        }
        
    }

    async editDmo(dmo: ShortDmoDto): Promise<ShortDmoDto> {
        if (!this.isConnected) {
            return;
        }
        try {
            return await this.hubConnection.invoke('UpdateDmoInfo', dmo);
        } catch (err) {
            return Promise.reject();
        }
    }
    
}
