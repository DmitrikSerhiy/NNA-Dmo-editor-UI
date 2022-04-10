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

export class EditorValidationMessage {
    fieldName: string;
    validationMessage: string;
}

export class ValidationResultField {
    field: string;
    errors: string[];
}

export class ValidationResult {
    title: string;
    fields: ValidationResultField[]
}

export class ValidationResultHandled {
    constructor(title: string) {
        this.isHandled = true;
        this.title = title;
    }
    isHandled: boolean;
    title: string;
}

export enum SendMailReason {
    setPassword,
    resetPassword
} 

