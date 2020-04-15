export interface IServerResponse {
    errorMessage: string;
}

export class UserDetails implements IServerResponse {
    errorMessage: string;
    email: string;
    accessToken: string;
    userName: string;
}

