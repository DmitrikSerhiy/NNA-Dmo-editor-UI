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
        private authService: AuthService,
        private router: Router, 
        private http: HttpClient,
        private errorHandler: CustomErrorHandler ) { 
            this.hubConnection = null;
    }

    async startConnection() {
        if (this.userManager.isAuthorized) {
            if(this.hubConnection != null && this.hubConnection.state != 'Disconnected') {
                return;
            }

            try {
                await this.authService.verify().toPromise();
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

    async updateDmosJson(dmo: NnaDmoWithBeatsAsJson): Promise<EditorResponseDto> {
        if (!this.isConnected) {
            return;
        }
        try {
            var response = await this.hubConnection.invoke('UpdateDmosJson', dmo);
            return Promise.resolve<EditorResponseDto>(response);
        } catch (err) {
            return Promise.reject(err);
        }
    }
    // ----- editor websocket methods ------


    // ----- editor http methods --------

    initialBeatsLoad(dmoId: string): Observable<string> {
        return this.http
            .get<string>(this.serverUrl + 'beats/initial/' + dmoId)
            .pipe(catchError( (response, obs) => this.errorHandler.handle<string>(response, obs)));
    }

    // ----- editor http methods --------
}
