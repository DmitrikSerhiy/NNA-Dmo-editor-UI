import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserManager } from '../shared/services/user-manager';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isAuthorized: boolean;

  constructor(
    private router: Router, 
    private userManager: UserManager) { }

  ngOnInit() {
    this.isAuthorized = this.userManager.isAuthorized();
  }

  toRegistration() {
    this.router.navigate(["/signup"]);
  }

  toLogin() {
    this.router.navigate(["/login"]);
  }

  toLayout() {
    this.router.navigate(["/app"]);
  }


}
