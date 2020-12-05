export class EditorResponseDto {
    httpCode: string;
    header: string;
    message: string;
    isSuccessful: boolean;

    errors: EditorErrorDetailsDto[];
    warnings: EditorValidationDetailsDto[];

    data: any;
}

export class EditorErrorDetailsDto {
    errorMessage: string;
}

export class EditorValidationDetailsDto {
    validationMessage: string;
    fieldName: string;
}