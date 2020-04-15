import { Toastr } from './../../shared/services/toastr.service';
import { DmosService } from './../../shared/services/dmos.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dmo',
  templateUrl: './dmo.component.html',
  styleUrls: ['./dmo.component.scss']
})
export class DmoComponent implements OnInit {

  constructor(
    private dmosService: DmosService,
    private toastr: Toastr) { }

  ngOnInit() {

    this.dmosService.getDmo('1c1b7d62-6a1a-4f0a-9691-2418c1e0f324').subscribe({
      next: (res) => {console.log(res); }
    });
  }

}
