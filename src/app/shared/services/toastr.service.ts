import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';
import { EditorValidationMessage, ToastrErrorMessage, ValidationResult, ValidationResultField } from '../models/serverResponse';

@Injectable()
export class Toastr {

    private toastrDelay = 1500;
    private longtoastrDelay = 5000;

    constructor(private toastr: ToastrService) { }

    success(message: string) {
        this.toastr.show(message, "Success!", { timeOut: this.toastrDelay });
    }

    warning(errorObject: ToastrErrorMessage) {
        this.toastr.show(`${errorObject.header} ${errorObject.message}`, "Warning", { timeOut: this.longtoastrDelay });
    }

    showValidationMessage(result: ValidationResult): void {
        this.toastr.show(this.formatValidationMessages(result.fields, result.title), "Warning", { enableHtml: true, timeOut: this.longtoastrDelay });
    }

    showValidationMessageForEditor(validations: EditorValidationMessage[], subHeader: string): void {
        this.toastr.show(this.formatValidationMessagesForEditor(validations, subHeader), "Warning", { enableHtml: true, timeOut: this.longtoastrDelay });
    }

    showError(errorObject: ToastrErrorMessage) {
        this.toastr.show(this.formatErrorMessages(errorObject), "Error!", { enableHtml: true, timeOut: this.longtoastrDelay });
    }

    private formatErrorMessages(errorMessage: ToastrErrorMessage) {
        let result: string = "<div class='validation-separator'></div>";
        result += errorMessage.header;
        result += "<div class='validation-separator'></div>";
        result += errorMessage.message;
        return result;
    }

    private formatValidationMessages(fields: ValidationResultField[], title: string) {
        let result: string = "<div class='validation-separator'></div>";
        result += title;
        fields.forEach(element => {
            let fieldErrors: string = "Validations: ";
            element.errors.forEach(fieldError => { fieldErrors += `<text> ${fieldError}. </text> <div class='validation-separator big-separator'></div>`})
            result += "<div class='validation-separator huge-separator'></div>";
            result += `<text>Field: <strong>${element.field}</strong></text>`;
            result += "</text> <div class='validation-separator big-separator'></div>";
            result += fieldErrors;
            result += "<div class='validation-separator'></div>";
        });

        return result;
    }

    private formatValidationMessagesForEditor(validations: EditorValidationMessage[], subHeader: string) {
        let result: string = "<div class='validation-separator'></div>";
        result += subHeader;
        validations.forEach(validation => {
            result += "</text> <div class='validation-separator big-separator'></div>";
            result += `<text>Field: <strong>${validation.fieldName}</strong>. Validation: <strong>${validation.validationMessage}</strong></text>`;
            result += "</text> <div class='validation-separator big-separator'></div>";
        });

        return result;
    }

}
