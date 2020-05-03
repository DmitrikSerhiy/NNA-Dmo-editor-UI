import { environment } from './../../../environments/environment';
import { Toastr } from '../../shared/services/toastr.service';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import * as signalR from '@aspnet/signalr';


@Component({
  selector: 'app-dmo-editor',
  templateUrl: './dmo-editor.component.html',
  styleUrls: ['./dmo-editor.component.scss']
})
export class DmoEditorComponent implements OnInit {
  @ViewChild('dmobit', { static: true }) dmobit: ElementRef;
  private hubConnection: signalR.HubConnection;

  constructor(
    private dmosService: DmosService,
    private toastr: Toastr) { }

  ngOnInit() {
    // this.dmosService.getDmo('1c1b7d62-6a1a-4f0a-9691-2418c1e0f324').subscribe({
    //   next: (res) => {console.log(res); }
    // });
  }

  onEnter() {
    let text = this.dmobit.nativeElement.value;
    console.log(text);

    this.startConnection();
    this.listener();
  }

  startConnection()  {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.server_user + 'editor')
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  listener() {
    this.hubConnection.on('Send', (data) => {
      console.log(data);
    });
  }
}
