import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class CharactersColorPaleteService {

	// 9 colors
	private mainPatete: string[] = [
		'#a4c400', // lime
		'#009B77', // dark-lignt green
		'#3e65ff', // blue
		'#aa00ff', // violet
		'#a20025', // deep red
		'#f0a30a', // orange
		'#76608a', // mauve
		'#9A8B4F', // muted gold
		'#a0522d'  // brown-red
	];

	// 5 more
	private secondaryPalete: string[] = [
		'#6d8764', // muted green
		'#e3c800', // golden
		'#C3447A', // rose
		'#92A8D1', // light blue
		'#009B77'  // emerlad
	];

	constructor() { }

	getNotUsedColor(usedColors: string[]): string {
		const usedColorsWithoutDefault = usedColors.filter(color => color != "#000000");
		// shuffle main palete first
		let remainingColors = usedColorsWithoutDefault?.length == 0 
			? this.mainPatete
			: this.shuffleColors(this.mainPatete).filter(color => !usedColorsWithoutDefault.includes(color));

		// if main palete is drain then try secondary palete
		if (remainingColors?.length == 0) {
			remainingColors = this.shuffleColors(this.secondaryPalete).filter(color => !usedColorsWithoutDefault.includes(color));
		}

		if (remainingColors?.length == 0) {
			return "#000000";
		}

		return remainingColors[Math.floor(Math.random() * remainingColors.length)];
	}


	private shuffleColors(colorsToShuffle: string[]) {
		let paleteCopy = [...colorsToShuffle];
		let currentIndex = paleteCopy.length,  randomIndex;
	  
		while (currentIndex != 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
	  
		  	[paleteCopy[currentIndex], paleteCopy[randomIndex]] = [paleteCopy[randomIndex], paleteCopy[currentIndex]];
		}
	  
		return paleteCopy;
	}
}
