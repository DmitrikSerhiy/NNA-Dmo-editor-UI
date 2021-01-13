import { EventEmitter } from '@angular/core';
import { Component, Input, OnInit, Output } from '@angular/core';
import { BeatDetailsDto } from '../../models/editorDtos';

@Component({
  selector: 'app-beats-container',
  templateUrl: './beats-container.component.html',
  styleUrls: ['./beats-container.component.scss']
})
export class BeatContainerComponent implements OnInit {

  @Input() beatsData: BeatDetailsDto[];
  @Output() lineCountChanged: EventEmitter<any>;
  
  private lineHeigth: number
  private beatContrainerMinHeight: number;

  constructor() { 
    this.lineHeigth = 16;
    this.beatContrainerMinHeight = 32;
    this.lineCountChanged = new EventEmitter();
  
  }

  ngOnInit(): void {
    if (!this.beatsData) {
      this.beatsData = [];
      let defaultBeatDetails = new BeatDetailsDto();
      defaultBeatDetails.id = 'default';
      defaultBeatDetails.lineCount = 1;
      defaultBeatDetails.text = '';

      this.beatsData.push(defaultBeatDetails);
    }
  }

  beatPreset($event, beatData: BeatDetailsDto) {
    let key = $event.which || $event.keyCode || $event.charCode;
    if ((key == 13 && !key.shiftKey) || key == 13) {    
      $event.preventDefault();
      return;
    }
  }

  beatSet ($event, beatData: BeatDetailsDto) {
    let spanHeight = $event.target.offsetHeight;
    let lines = Math.ceil(spanHeight / this.lineHeigth);
    let newLineCount: number;
    
    if (lines <= 1 ) {
      newLineCount = 1;
    } else { 
      newLineCount = lines % 2 == 0 ? (lines / 2) : Math.floor(lines / 2) + 1;
    }

    if (lines % 2 != 0) {
      if ($event.target.parentNode.style.marginBottom == '0px') {
        let margin = (this.beatContrainerMinHeight * newLineCount) - (lines * this.lineHeigth);
        $event.target.parentNode.style.marginBottom = `${margin}px`;
      }
    } else {
      $event.target.parentNode.style.marginBottom = '0px';
    }

    if (beatData.lineCount < newLineCount) {
        this.lineCountChanged.emit({beatData, newLineCount});

    } else if (beatData.lineCount > newLineCount) {
        this.lineCountChanged.emit({beatData, newLineCount});
    } 
  }

  beatClick ($event: any) {
    if ($event.target.localName == 'div') {
      $event.target.children[0].focus();
      var range = document.createRange();
      var sel = window.getSelection();
      
      if ($event.target.children[0].innerText.length > 0) {
        range.setStart($event.target.children[0], 1);
      } else { 
        range.setStart($event.target.children[0], 0);
      }
      range.collapse(true)

      sel.removeAllRanges();
      sel.addRange(range);
    }


  }

}
