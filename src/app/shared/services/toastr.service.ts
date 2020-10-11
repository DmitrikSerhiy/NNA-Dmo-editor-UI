import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';

@Injectable()
export class Toastr {

    toastrDelay = 2000;
    longtoastrDelay = 5000;

    constructor(private toastr: ToastrService) { }

    success(message: string) {
        this.toastr.success(message, 'Success!', {
            timeOut: this.toastrDelay
        });
    }

    info(message: string) {
        this.toastr.info(message, 'Info', {
            timeOut: this.toastrDelay
        });
    }

    error(errorObject: any) {
        this.toastr.error(errorObject.message, errorObject.header, {
            timeOut: this.toastrDelay
        });
    }

}
