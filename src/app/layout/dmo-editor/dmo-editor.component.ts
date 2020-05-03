import { EditorHub } from './services/editor-hub.sercice';

import { Toastr } from '../../shared/services/toastr.service';
import { DmosService } from '../../shared/services/dmos.service';
import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';



@Component({
  selector: 'app-dmo-editor',
  templateUrl: './dmo-editor.component.html',
  styleUrls: ['./dmo-editor.component.scss']
})
export class DmoEditorComponent implements OnInit {
  @ViewChild('dmobit', { static: true }) dmobit: ElementRef;

  constructor(
    private editorHub: EditorHub,
    private dmosService: DmosService,
    private toastr: Toastr) { }

  ngOnInit() {
    // this.dmosService.getDmo('1c1b7d62-6a1a-4f0a-9691-2418c1e0f324').subscribe({
    //   next: (res) => {console.log(res); }
    // });

  }

  connect() {
    this.editorHub.startConnection();
  }

  disconnect() {
    this.editorHub.abortConnection();
  }

  onEnter() {
    let text = this.dmobit.nativeElement.value;
    console.log(text);

    this.editorHub.sendBeat(text);
  }

}
