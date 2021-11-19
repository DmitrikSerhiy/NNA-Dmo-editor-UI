import { Injectable } from '@angular/core';

@Injectable()
export class UserManager {

    constructor() { }
        
    isAuthorized(): boolean {
        return localStorage.getItem('user access token') !== null;
    }

    getCurrentUser(): string {
        return localStorage.getItem('user name');
    }

    getCurrentUserEmail(): string {
        return localStorage.getItem('user email');
    }


    getAccessToken(): string {
        return localStorage.getItem('user access token');
    }

    getRefreshToken(): string {
        return localStorage.getItem('user refresh token');
    }

    saveUserData(accessToken, email, userName, refreshToken): void {
        this.setLocalStorage(accessToken, email, userName, refreshToken);
    }

    updateTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem('user access token', accessToken);
        localStorage.setItem('user refresh token', refreshToken);    
    }

    clearUserData(): void {
        localStorage.removeItem('user access token');
        localStorage.removeItem('user email');
        localStorage.removeItem('user name');
        localStorage.removeItem('user refresh token');        
    }

    private setLocalStorage(accessToken: string, email: string, userName: string, refreshToken: string): void {
        localStorage.setItem('user access token', accessToken);
        localStorage.setItem('user email', email);
        localStorage.setItem('user name', userName);
        localStorage.setItem('user refresh token', refreshToken);
    }
}
