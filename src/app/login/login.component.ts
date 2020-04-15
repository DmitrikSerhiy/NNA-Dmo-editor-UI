import { Toastr } from './../shared/services/toastr.service';
import { UserManager } from '../shared/services/user-manager';
import { AuthService } from './../shared/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { routerTransition } from '../router.animations';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [routerTransition()]
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  constructor(
    public router: Router,
    private authService: AuthService,
    private userManager: UserManager,
    private toast: Toastr) {
  }


  ngOnInit() {
    this.loginForm = new FormGroup({
      'email': new FormControl('', [Validators.required, Validators.email]),
      'password': new FormControl('', [Validators.required, Validators.minLength(8)])
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.authorize(this.loginForm.get('email').value, this.loginForm.get('password').value)
        .subscribe((response) => {
          this.userManager.login(response.accessToken, response.email, response.userName);
        },
        (error) => {
          this.toast.info(error);
        });
    }
    return;
  }
}
