import { PartialDmoUpdateDto, DmoDto, CreateDmoDto, EditDmoInfoDto } from './../../models';

import { UserManager } from './../../../shared/services/user-manager';
import { Injectable } from '@angular/core';

import * as signalR from '@microsoft/signalr';
import { environment } from './../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EditorHub {
    private hubConnection: signalR.HubConnection;
    private connectionIsBuilt = false;

    constructor(private userManager: UserManager) { }

    async startConnection() {
        if (this.userManager.isAuthorized) {
            this.createConnection();
            this.registerOnServerEvents();
            try {
                await this.hubConnection.start();
                console.log('Connection started');
            } catch (err) {
                console.error('Error while starting connection: ' + err);
            }
        }
    }

    async abortConnection() {
        if (!this.connectionIsBuilt) {
            return;
        }
        try {
            await this.hubConnection.stop();
            this.connectionIsBuilt = false;
            console.log('Connection stopped');
        } catch (err) {
            console.error('Error while stoppint connection: ' + err);
        }
    }

    private createConnection() {
        this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(environment.server_user + 'editor', {
            accessTokenFactory: () => this.userManager.getJWT(), // todo: request refresh token if expired
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets })
        .configureLogging(signalR.LogLevel.Information)
        // .withAutomaticReconnect() //todo: uncomment for prod
        .build();

        // this.hubConnection.onreconnecting((error) => {
        //     if (error != null) {
        //         console.error(error);
        //     } else {
        //         // todo: show orange reconnecting status;
        //         console.log('Reconnecting...');
        //     }
        // });
        // todo: uncoment for prod
        // this.hubConnection.onreconnected(() => {
        //     //todo: show green reconnected status;
        //     console.log('Reconnected.');
        // });
        this.hubConnection.onclose((error) => {
            if (error != null) {
                console.error(error);
            }
            // todo: show red reconnected status;
        });
        this.connectionIsBuilt = true;
    }

    private registerOnServerEvents() {
        if (!this.connectionIsBuilt) {
            return;
        }
        // this.hubConnection.on('PartialDmoUpdateResult', (data) => {
        //     console.log(data);
        //   });
    }

    async partiallyUpdateDmo(dmoUpdate: PartialDmoUpdateDto) {
        if (!this.connectionIsBuilt) {
            return;
        }
        await this.hubConnection.invoke('DmoUpdate', dmoUpdate);
    }

    async loadDmo(dmoId: string): Promise<DmoDto> {
        if (!this.connectionIsBuilt) {
            return;
        }
        return await this.hubConnection.invoke('LoadDmo', dmoId);
    }

    async createDmo(dmo: CreateDmoDto): Promise<CreateDmoDto> {
        if (!this.connectionIsBuilt) {
            return;
        }
        return await this.hubConnection.invoke('CreateDmo', dmo);
    }

    async editDmo(dmo: EditDmoInfoDto): Promise<EditDmoInfoDto> {
        if (!this.connectionIsBuilt) {
            return;
        }
        return await this.hubConnection.invoke('UpdateDmoInfo', dmo);
    }
}
