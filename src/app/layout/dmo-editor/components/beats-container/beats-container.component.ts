import { Component, Input, OnInit } from '@angular/core';
import { BeatDetailsDto } from '../../models/editorDtos';

@Component({
  selector: 'app-beats-container',
  templateUrl: './beats-container.component.html',
  styleUrls: ['./beats-container.component.scss']
})
export class BeatContainerComponent implements OnInit {

  @Input() beatsData: BeatDetailsDto[];
  
  private maxCharactersCountPerLine: number;

  constructor() { 
    this.maxCharactersCountPerLine = 80;
  }

  ngOnInit() {
  }

  beatSet (newText: string, beatData: BeatDetailsDto) {
    newText.substr(this.maxCharactersCountPerLine);
    if (newText.length > beatData.text.length) {
      
      console.log("add");
      // added character
    } else if (newText.length < beatData.text.length) {
      console.log('removed');
      // removed
    } 

    //use this here https://stackoverflow.com/questions/35378087/how-to-use-ngmodel-on-divs-contenteditable-in-angular2
    // beatData.text = newText;
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
