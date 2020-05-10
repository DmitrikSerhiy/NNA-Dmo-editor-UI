import { ActivatedRoute } from '@angular/router';
import { PartialDmoUpdateDto as ShortDmoWithBeatsDto } from './emo-editor-dtos';
import { EditorHub } from './services/editor-hub.sercice';

import { Toastr } from '../../shared/services/toastr.service';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dmo-editor',
  templateUrl: './dmo-editor.component.html',
  styleUrls: ['./dmo-editor.component.scss']
})
export class DmoEditorComponent implements OnInit, OnDestroy {
  @ViewChild('dmobit', { static: true }) dmobit: ElementRef;
  dmoId: string;
  isConnected = false;

  constructor(
    private editorHub: EditorHub,
    private dmosService: DmosService,
    private activatedRoute: ActivatedRoute,
    private toastr: Toastr) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.dmoId = params['dmoId'];
    });

    if (this.dmoId) {
      this.connect().then(r => this.editorHub.loadDmo(this.dmoId));
    }
  }

  async ngOnDestroy() {
    await this.disconnect();
  }

  async connect() {
    await this.editorHub.startConnection();
    this.isConnected = true;
  }

  async disconnect() {
    await this.editorHub.abortConnection();
    this.isConnected = false;
  }

  onEnter() {
    let text = this.dmobit.nativeElement.value;
    console.log(text);


    const update1: ShortDmoWithBeatsDto = {
      id: '1c1b7d62-6a1a-4f0a-9691-2418c1e01111',
      beats: [
      {
        id: '',
        description: 'first beat',
        order: 1,
        plotTimeSpot: {hours: 0, minutes: 5 }
      },
      {
        id: '',
        description: 'second beat',
        order: 2,
        plotTimeSpot: {hours: 0, minutes: 8 }
      }
    ]
  };

    //this.editorHub.partiallyUpdateDmo(update1);

    this.editorHub.loadDmo('1c1b7d62-6a1a-4f0a-9691-2418c1e01111');
  }

}
