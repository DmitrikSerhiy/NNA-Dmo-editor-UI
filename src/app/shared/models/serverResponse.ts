export interface IServerResponse {
    errorMessage: string;
}

export class UserDetails implements IServerResponse {
    errorMessage: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    userName: string;
}

export class TokenDetails {
    accessToken: string;
    refreshToken: string;
}

export class ToastrErrorMessage {
    message: string;
    header: string;

    constructor(error: string, header: string) {
        this.message = error;
        this.header = header;
    }
}

export enum SendMailReason {
    setPassword,
    resetPassword
} 

