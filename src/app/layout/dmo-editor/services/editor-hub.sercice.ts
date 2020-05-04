import { PartialDmoUpdateDto } from './../emo-editor-dtos';
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

    startConnection() {
        if (this.userManager.isAuthorized) {
            this.createConnection();
            this.registerOnServerEvents();
            this.hubConnection
                .start()
                .then(() => console.log('Connection started'))
                .catch(err => console.log('Error while starting connection: ' + err));
            }
    }

    abortConnection() {
        this.hubConnection.stop()
            .then(() => console.log('Connection stopped'))
            .catch(err => console.log('Error while stoppint connection: ' + err));
        this.connectionIsBuilt = false;
    }


    partiallyUpdateDmo(dmoUpdate: PartialDmoUpdateDto) {
        if (this.connectionIsBuilt) {
            this.hubConnection.invoke('DmoUpdate', dmoUpdate);
        }
    }

    private createConnection() {
        this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(environment.server_user + 'editor', {
            accessTokenFactory: () => this.userManager.getJWT(),//todo: request refresh token if expired
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets })
        .configureLogging(signalR.LogLevel.Information)
        .withAutomaticReconnect()
        .build();

        this.hubConnection.onreconnecting((error) => {
            if (error != null) {
                console.error(error);
            } else {
                //todo: show orange reconnecting status;
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
            //todo: show red reconnected status;
            console.log('connection clesed');
        });
        this.connectionIsBuilt = true;
    }

    private registerOnServerEvents() {
        this.hubConnection.on('UpdateNotify', (data) => {
            console.log(data);
          });
    }
}
