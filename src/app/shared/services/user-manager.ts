import { Injectable } from '@angular/core';
import { UserRole } from '../models/authDto';
import { SidebarManagerService } from './sidebar-manager.service';

@Injectable()
export class UserManager {

    constructor(private sidebarManagerService: SidebarManagerService) { }
        
    isAuthorized(): boolean {
        return localStorage.getItem('user access token') !== null;
    }

    getCurrentUser(): string {
        return localStorage.getItem('user name');
    }

    getCurrentUserEmail(): string {
        return localStorage.getItem('user email');
    }

    updateUserName(newUserName: string): void {
        localStorage.removeItem('user name');
        localStorage.setItem('user name', newUserName);
    }

    getAccessToken(): string {
        return localStorage.getItem('user access token');
    }

    getHighestUserRole() : UserRole {
        const rolesItems = localStorage.getItem('roles');
        
        if (!rolesItems) {
            return UserRole.None;
        }

        const roles = rolesItems.split(',');
        if (roles.includes(UserRole[UserRole.SuperUser].toString())) {
            return UserRole.SuperUser;
        } 

        if (roles.includes(UserRole[UserRole.ActiveUser].toString())) {
            return UserRole.ActiveUser;
        } 

        if (roles.includes(UserRole[UserRole.NotActiveUser].toString())) {
            return UserRole.NotActiveUser;
        } 
        
        return UserRole.None;
    }

    getRefreshToken(): string {
        return localStorage.getItem('user refresh token');
    }

    saveUserData(accessToken, email, userName, refreshToken): void {
        this.setLocalStorage(accessToken, email, userName, refreshToken);
        this.setUserRoles();
    }

    updateTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem('user access token', accessToken);
        localStorage.setItem('user refresh token', refreshToken);    
        this.setUserRoles();
    }

    clearUserData(): void {
        localStorage.removeItem('user access token');
        localStorage.removeItem('user email');
        localStorage.removeItem('user name');
        localStorage.removeItem('user refresh token');
        localStorage.removeItem('roles');
        
        this.sidebarManagerService.clearSidebarState();
    }

    private setLocalStorage(accessToken: string, email: string, userName: string, refreshToken: string): void {
        localStorage.setItem('user access token', accessToken);
        localStorage.setItem('user email', email);
        localStorage.setItem('user name', userName);
        localStorage.setItem('user refresh token', refreshToken);
    }

    private setUserRoles(): void {
        const token = this.getAccessToken();
        if (!token) {
            return;
        }

        const payload = token.split('.')[1];
        const roles = this.parsePayload(payload).rls;
        localStorage.setItem('roles', roles);
    }

    private parsePayload (payload: string) : any {
        var base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    
        return JSON.parse(jsonPayload);
    }
}
