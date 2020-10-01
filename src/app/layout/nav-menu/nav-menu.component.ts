import { UserManager } from '../../shared/services/user-manager';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent implements OnInit {
  isAuthorized = false;
  public pushRightClass = 'push-right';

  constructor(
    public router: Router,
    private userManager: UserManager) { }

  ngOnInit() {
    this.isAuthorized = this.userManager.isAuthorized();
  }

  onLoggedout() {
    this.userManager.logout();
  }
}
