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
}