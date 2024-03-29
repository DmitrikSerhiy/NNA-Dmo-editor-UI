export interface AuthGoogleDto {
    email: string;
    name: string;
    googleToken: string;
} 

export interface PersonalInfoDto {
    userName: string;
    userEmail: string;
    userId: string;
    authProviders: string[];
    isEmailVerified: boolean;
    hasPassword: boolean;
    isEmailSent: boolean;
    lastTimeEmailSent: string;
}


export enum UserRole {
    None = 0,
    NotActiveUser,
    ActiveUser,
    SuperUser
}