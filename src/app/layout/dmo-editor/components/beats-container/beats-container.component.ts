import { ElementRef, EventEmitter, QueryList, ViewChildren } from '@angular/core';
import { Component, Input, OnInit, Output } from '@angular/core';
import { BeatDetailsDto } from '../../models/editorDtos';
import { DefaultDataGeneratorService } from '../../services/default-data-generator.service';
import { TextDetectorService } from '../../services/text-detector.service';

@Component({
  selector: 'app-beats-container',
  templateUrl: './beats-container.component.html',
  styleUrls: ['./beats-container.component.scss']
})
export class BeatContainerComponent implements OnInit {

  @Input() beatsData: BeatDetailsDto[];
  @Output() lineCountChanged: EventEmitter<any>;
  @Output() beatsTextChanged: EventEmitter<any[]>;
  @Output() beatAdded: EventEmitter<any>;
  @ViewChildren('beatText') beats: QueryList<ElementRef>;
  
  private lineHeigth: number
  private beatContrainerMinHeight: number;

  constructor(
    private textChangeDetector: TextDetectorService,
    private dataGenerator: DefaultDataGeneratorService) { 
    this.lineHeigth = 16;
    this.beatContrainerMinHeight = 32;
    this.lineCountChanged = new EventEmitter();
    this.beatsTextChanged = new EventEmitter();
    this.beatAdded = new EventEmitter();
  }

  ngOnInit(): void {
    this.textChangeDetector.textDetector.subscribe((changes: any[]) => {
      this.beatsTextChanged.emit(changes);

      changes.forEach(change => {
        this.beats.forEach(beat => {
          if (beat.nativeElement.getAttribute('id') === change.beatId) {
            beat.nativeElement.innerText = change.data; //some strange fix of text dublication
          }
        });
      });
    });

    if (!this.beatsData) {
      this.beatsData = [];
      this.beatsData.push(this.dataGenerator.createBeatWithDefaultData());
    }
  }

  beatPreset($event, beatData: BeatDetailsDto) {
    let key = $event.which || $event.keyCode || $event.charCode;
    if ((key == 13 && !key.shiftKey) || key == 13) {  
      $event.preventDefault();
      this.beatAdded.emit({ currentBeat: beatData });
      return;
    }
  }

  beatSet ($event, beatData: BeatDetailsDto) {
    let key = $event.which || $event.keyCode || $event.charCode;
    if (key == 13) {
      $event.preventDefault();
      return;
    }

    this.textChangeDetector.detect(beatData.id, $event.target.innerText);
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
