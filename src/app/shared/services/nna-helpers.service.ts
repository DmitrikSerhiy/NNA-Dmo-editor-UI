import { Injectable } from '@angular/core';

@Injectable({
  	providedIn: 'root'
})
export class NnaHelpersService {

  	constructor() { }


	containsNonAllowedSymbols(value: string): boolean {
		if (!value) {
			return false;
		}

		const regex = /\d|\w|[\.\$@\*\\\/\+\-\^\!\(\)\[\]\~\%\&\=\?\>\<\{\}\"\'\,\:\;\#\_]/g;
		let contains = false;
		[...value].forEach(passSymbol => {
			if (passSymbol.match(regex) === null) {
				contains = true;
				return;
			}
		});

		return contains;
    } 

	async setTimeoutAsync(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	sanitizeSpaces(input: string): string {
		return input?.split(' ').reduce((p, n) => {
			if (p.trim() == '') {
				return n.trim();
			}
			if (n.trim() == '') {
				return p.trim();
			}
			return p.trim() + ' ' + n.trim();
		}) ?? '';
	}

	groupBy(array, lambda): any {
		return array.reduce((out, val) => {
			let by = typeof lambda === 'function' ? '' + lambda(val) : val[lambda];
			(out[by] = out[by] || []).push(val);
			return out;
		}, {});
	};
}
