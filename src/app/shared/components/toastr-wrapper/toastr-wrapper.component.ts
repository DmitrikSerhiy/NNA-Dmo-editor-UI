import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Toast, ToastPackage, ToastrService } from 'ngx-toastr';

@Component({
	selector: 'app-toastr-wrapper',
  	templateUrl: './toastr-wrapper.component.html',
	styleUrls: ['./toastr-wrapper.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class ToastrWrapperComponent extends Toast {

	@ViewChild('toastrWrapper', {static: false }) body: ElementRef;

	constructor(
		protected toastrService: ToastrService,
		public toastPackage: ToastPackage) {
			super(toastrService, toastPackage);
	}

	remove() {
		this.body.nativeElement.classList.remove('openning');
		this.body.nativeElement.classList.add('closing');
		setTimeout(() => {super.remove()}, 300);
	}

}
