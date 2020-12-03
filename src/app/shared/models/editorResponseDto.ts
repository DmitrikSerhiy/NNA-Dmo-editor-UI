export class EditorResponseDto {
    httpCode: string;
    header: string;
    message: string;

    errors: EditorErrorDetailsDto[];
    warnings: EditorValidationDetailsDto[];

    result: any;
}

export class EditorErrorDetailsDto {
    errorMessage: string;
}

export class EditorValidationDetailsDto {
    validationMessage: string;
    fieldName: string;
}