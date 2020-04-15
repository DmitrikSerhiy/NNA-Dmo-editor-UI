import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  selector: 'app-remove-dmo-popup',
  templateUrl: './remove-dmo-popup.component.html',
  styleUrls: ['./remove-dmo-popup.component.scss']
})
export class RemoveDmoPopupComponent implements OnInit {

  dmoName: string;
  constructor(
    public dialogRef: MatDialogRef<RemoveDmoPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
      this.dmoName = data;
     }

  ngOnInit() {}

  onClose(shoulSave: boolean) {
    if (!shoulSave) {
      this.dialogRef.close();
      return;
    }
    this.dialogRef.close(true);
  }
}
