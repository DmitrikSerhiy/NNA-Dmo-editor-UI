import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';
import { ToastrErrorMessage, ValidationResult, ValidationResultField } from '../models/serverResponse';

@Injectable()
export class Toastr {

    toastrDelay = 2000;
    longtoastrDelay = 5000;

    constructor(private toastr: ToastrService) { }

    success(message: string) {
        this.toastr.success(message, 'Success!', {
            timeOut: this.toastrDelay,
            positionClass: 'toast-bottom-right',
            
        });
    }

    info(message: string) {
        this.toastr.info(message, 'Info', {
            timeOut: this.toastrDelay,
            positionClass: 'toast-bottom-right'
        });
    }

    warning(errorObject: ToastrErrorMessage) {
        this.toastr.warning(errorObject.message, errorObject.header, {
            timeOut: this.toastrDelay,
            positionClass: 'toast-bottom-right',
        });
    }

    validationMessage(result: ValidationResult): void {
        this.toastr.warning(this.formatValidationErrors(result.fields), result.title, {
            positionClass: 'toast-bottom-right',
            enableHtml: true,
            closeButton: true,
            tapToDismiss: true,
            disableTimeOut: true,

        });
    }

    error(errorObject: ToastrErrorMessage) {
        this.toastr.error(errorObject.message, errorObject.header, {
            timeOut: this.toastrDelay,
            positionClass: 'toast-bottom-right'
        });
    }

    private formatValidationErrors(fields: ValidationResultField[]) {
        let result: string = "<hr>";
        fields.forEach(element => {
            let fieldErrors: string = "Validations: ";
            element.errors.forEach(fieldError => { fieldErrors += `<text"> ${fieldError} </text>`})
            result += `<text>Field: <strong>${element.field}</strong></text>`;
            result += "<hr>";
            result += fieldErrors;
            result += "<hr>";
        });

        return result;
    }

}
