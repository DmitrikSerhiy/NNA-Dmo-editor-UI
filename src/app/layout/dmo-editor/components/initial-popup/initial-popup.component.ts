import { MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-initial-popup',
  templateUrl: './initial-popup.component.html',
  styleUrls: ['./initial-popup.component.scss']
})
export class InitialPopupComponent implements OnInit {
  @ViewChild('dmoMovieTitle', { static: true }) dmoMovieTitle: ElementRef;
  @ViewChild('dmoName', { static: true }) dmoName: ElementRef;
  constructor(public dialogRef: MatDialogRef<InitialPopupComponent>) {}

  ngOnInit() {}

  onClose(shoulSave: boolean) {
    if (!shoulSave) {
      this.dialogRef.close();
      return;
    }
    this.dialogRef.close({
      dmoName: this.dmoName.nativeElement.value,
      dmoMovieTitle: this.dmoMovieTitle.nativeElement.value});
  }
}
