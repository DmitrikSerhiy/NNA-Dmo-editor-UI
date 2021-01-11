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
  @Output() incrementLineCount: EventEmitter<BeatDetailsDto>;
  @Output() decrementLineCount: EventEmitter<BeatDetailsDto>;
  
  private maxCharactersCountPerLine: number;
  private lineHeigth: number

  constructor() { 
    this.maxCharactersCountPerLine = 80;
    this.lineHeigth = 15;
    this.incrementLineCount = new EventEmitter();
    this.decrementLineCount = new EventEmitter();
  }

  ngOnInit() {
  }

 
  beatPreset($event, beatData: BeatDetailsDto) {
    let key = $event.which || $event.keyCode || $event.charCode;
    if ((key == 13 && !key.shiftKey) || key == 13) {    
      $event.preventDefault();
      return;
    }
  }

  beatSet ($event, beatData: BeatDetailsDto) {
    let divHeight = $event.target.offsetHeight;
    let lines = Math.floor(divHeight / this.lineHeigth);
    let newLineCount: number;
    
    if (lines <= 1 ) {
      newLineCount = 1;
    } else { 
      newLineCount = lines % 2 == 0 ? (lines / 2) : Math.floor(lines / 2) + 1;
    }

    if (beatData.lineCount < newLineCount) {
        this.incrementLineCount.emit(beatData);
    } 
    else if (beatData.lineCount > newLineCount) {
        this.decrementLineCount.emit(beatData);
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
