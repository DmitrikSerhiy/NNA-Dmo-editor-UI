import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, HostListener } from '@angular/core';

@Component({
  selector: 'app-initial-popup',
  templateUrl: './initial-popup.component.html',
  styleUrls: ['./initial-popup.component.scss']
})
export class InitialPopupComponent implements OnInit {
  private initialData: any;
  isEdit = false;
  dmoForm: FormGroup;
  get dmoNameInput() { return this.dmoForm.get('dmoNameInput'); }
  get movieTitleInput() { return this.dmoForm.get('movieTitleInput'); }
  get shortComment() { return this.dmoForm.get('shortComment'); }
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if( event.key === "Enter") {
      this.onClose(false);
    }
  }


  constructor(
    public dialogRef: MatDialogRef<InitialPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      if (data) {
        this.initialData = data;
        this.isEdit = true;
      } else {
        this.initialData = { cancelled: false };
      }
    }

  ngOnInit() {
    this.dialogRef.backdropClick().subscribe(() => this.onClose(true));
    this.dmoForm = new FormGroup({
      'dmoNameInput': new FormControl('', [Validators.required]),
      'movieTitleInput': new FormControl('', [Validators.required]),
      'shortComment': new FormControl()
    });
    if (this.data) {
      this.dmoNameInput.setValue(this.data.name);
      this.movieTitleInput.setValue(this.data.movieTitle);
      this.shortComment.setValue(this.data.shortComment);
    }
  }

  onClose(cancelled: boolean) {
    if (cancelled) {
      this.initialData.cancelled = cancelled;
      this.dialogRef.close(this.initialData);
      return;
    }

    if (!this.dmoForm.valid) {
      return;
    }

    this.dialogRef.close({
      name: this.dmoNameInput.value,
      movieTitle: this.movieTitleInput.value,
      shortComment: this.shortComment.value,
      cancelled: false });
  }
}
