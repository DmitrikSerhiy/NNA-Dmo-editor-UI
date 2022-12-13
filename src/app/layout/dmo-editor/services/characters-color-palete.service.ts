import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class CharactersColorPaleteService {

	// 8 colors for main characters (equal by saturation)
	private mainPatete: string[] = [
		'#5E994E', // lime
		'#4F9C8A', // dark-lignt green
		'#4E5D99', // blue
		'#A35567', // deep red
		'#B3855B', // dark orange
		'#754E99', // mauve
		'#9A8B4F', // muted gold
		'#99664E'  // brown-red
	];

	// 5 more additional colors (for contrast by brightnes and hue)
	private secondaryPalete: string[] = [
		'#219900', // green
		'#D4BB00', // golden
		'#C3447A', // rose
		'#92A8D1', // light blue
		'#009B77'  // emerlad
	];

	private previousColor: string = '';

	constructor() { }

	getNotUsedColor(usedColors: string[]): string {
		const usedColorsWithoutDefault = usedColors.filter(color => color != "#000000");
		// shuffle main palete first
		let remainingColors = !usedColorsWithoutDefault?.length
			? this.mainPatete
			: this.shuffleColors(this.mainPatete).filter(color => !usedColorsWithoutDefault.includes(color));

		// if main palete is drain then try secondary palete
		if (!remainingColors?.length) {
			remainingColors = this.shuffleColors(this.secondaryPalete).filter(color => !usedColorsWithoutDefault.includes(color));
		}

		if (!remainingColors?.length) {
			return "#000000";
		}

		if (this.previousColor === '') {
			this.previousColor = this.getRandom(remainingColors);
			return this.previousColor;
		}

		let color = this.getRandom(remainingColors);
		let counter = 0;
		while (color == this.previousColor) {
			color = this.getRandom(remainingColors);
			if (counter == 3) {
				break;
			}
			counter++;
		}

		this.previousColor = color;
		return color;
	}

	private getRandom(remainingColors: string[]): string {
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
