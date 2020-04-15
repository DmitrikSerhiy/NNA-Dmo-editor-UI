import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class UserManager {

    constructor(
        private router: Router) { }

    isAuthorized() {
        return localStorage.getItem('user access token') !== null;
    }

    getCurrentUser() {
        return localStorage.getItem('user name');
    }

    getJWT() {
        return localStorage.getItem('user access token');
    }

    login(accessToken, email, userName) {
        console.log('Successful authentication');
        localStorage.setItem('user access token', accessToken);
        localStorage.setItem('user email', email);
        localStorage.setItem('user name', userName);
        this.router.navigateByUrl('/');
    }

    logout() {
        console.log('Logout');
        localStorage.removeItem('user access token');
        localStorage.removeItem('user email');
        localStorage.removeItem('user name');
        if (this.router.url === '/dashboard') {
            location.reload();
        } else {
            this.router.navigateByUrl('/').then(_ => {
                location.reload();
            });
        }
    }

    register(accessToken, email, userName) {
        console.log('Successful registration');
        localStorage.setItem('user access token', accessToken);
        localStorage.setItem('user email', email);
        localStorage.setItem('user name', userName);
        this.router.navigateByUrl('/');
    }
}
