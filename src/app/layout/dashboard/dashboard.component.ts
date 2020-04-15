import { RightMenuGrabberService } from './../../shared/services/right-menu-grabber.service';
import { Component, OnInit, Output } from '@angular/core';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private rightMenuGrabberService: RightMenuGrabberService) { }

  ngOnInit() {
    this.rightMenuGrabberService.hideGrabber();
  }

}
