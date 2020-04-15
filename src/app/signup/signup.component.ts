import { UserManager } from '../shared/services/user-manager';
import { AuthService } from './../shared/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Toastr } from '../shared/services/toastr.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  animations: [routerTransition()]
})
export class SignupComponent implements OnInit {

  registerForm: FormGroup;
  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }

  constructor(
    public router: Router,
    private authService: AuthService,
    private userManager: UserManager,
    private toast: Toastr) { }

  ngOnInit() {
    this.registerForm = new FormGroup({
      'name' : new FormControl('', [Validators.required]),
      'email': new FormControl('', [Validators.required, Validators.email]),
      'password': new FormControl('', [Validators.required, Validators.minLength(8)])
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(
        this.registerForm.get('name').value,
        this.registerForm.get('email').value,
        this.registerForm.get('password').value)
        .subscribe((response) => {
          this.userManager.register(response.accessToken, response.email, response.userName);
        },
        (error) => {
          this.toast.info(error);
        });
    }
    return;
  }
}
