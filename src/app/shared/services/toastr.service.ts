import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';
import { ToastrErrorMessage } from '../models/serverResponse';

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
            positionClass: 'toast-bottom-right'
        });
    }

    error(errorObject: ToastrErrorMessage) {
        this.toastr.error(errorObject.message, errorObject.header, {
            timeOut: this.toastrDelay,
            positionClass: 'toast-bottom-right'
        });
    }

}
