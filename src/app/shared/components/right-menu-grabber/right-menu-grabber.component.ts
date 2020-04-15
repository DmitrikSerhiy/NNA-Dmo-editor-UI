import { RightMenuGrabberService } from './../../services/right-menu-grabber.service';
import { RightMenues } from './../../../layout/models';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-right-menu-grabber',
  templateUrl: './right-menu-grabber.component.html',
  styleUrls: ['./right-menu-grabber.component.scss']
})
export class RightMenuGrabberComponent implements OnInit {

  @Input() menuName: RightMenues;
  @Input() userFriendlyMenuName: string;
  @Output() toggleMenu = new EventEmitter<string>();
  shouldbeShown: boolean;

  constructor(
    private rightMenuGrabberService: RightMenuGrabberService) { }

  ngOnInit() {
    this.rightMenuGrabberService.shouldShowGrabber$.subscribe({
      next: () => this.shouldbeShown = this.rightMenuGrabberService.isGrabbershouldBeShown()
    });
  }

  toggleRightMenu() {
    this.toggleMenu.emit(this.menuName);
  }
}
