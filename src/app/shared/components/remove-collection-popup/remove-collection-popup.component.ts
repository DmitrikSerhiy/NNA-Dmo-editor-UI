import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  selector: 'app-remove-collection-popup',
  templateUrl: './remove-collection-popup.component.html',
  styleUrls: ['./remove-collection-popup.component.scss']
})
export class RemoveCollectionPopupComponent implements OnInit {

  collectionName: string;
  constructor(
    public dialogRef: MatDialogRef<RemoveCollectionPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
      this.collectionName = data;
     }

  ngOnInit() {
  }

  onClose(shoulSave: boolean) {
    if (!shoulSave) {
      this.dialogRef.close();
      return;
    }
    this.dialogRef.close(true);
  }

}
