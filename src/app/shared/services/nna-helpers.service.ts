import { Injectable } from '@angular/core';

@Injectable({
  	providedIn: 'root'
})
export class NnaHelpersService {

  	constructor() { }


	containsNonEnglishSymbols(value: string): boolean {
		const regex = /\d|\w|[\.\$@\*\\\/\+\-\^\!\(\)\[\]\~\%\&\=\?\>\<\{\}\"\'\,\:\;\_]/g;
		let contains = false;

		if (!value) {
			return true;
		}

		[...value].forEach(passSymbol => {
			if (passSymbol.match(regex) === null) {
				contains = true;
				return;
			}
		});

		return contains;
    } 

	sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}