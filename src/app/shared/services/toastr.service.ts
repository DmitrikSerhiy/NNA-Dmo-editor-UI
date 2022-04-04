import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';
import { ToastrErrorMessage, ValidationResult, ValidationResultField } from '../models/serverResponse';

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

    validationMessage(result: ValidationResult): void {
        this.toastr.show(this.formatValidationErrors(result.fields, result.title), "Warning", { enableHtml: true, disableTimeOut: true});
    }

    error(errorObject: ToastrErrorMessage) {
        this.toastr.show(`${errorObject.header} ${errorObject.message}`, "Error!", { timeOut: this.longtoastrDelay });
    }

    private formatValidationErrors(fields: ValidationResultField[], title: string) {
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

}
