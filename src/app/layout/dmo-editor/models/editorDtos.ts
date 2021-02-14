
export class PlotPointDto {
    private _hour: TimeValueDto;
    private _minutes: TimeValueDto;
    private _seconds: TimeValueDto;
    private _isValid: boolean;

    constructor() {
        this._hour = new TimeValueDto('0');
        this._minutes = new TimeValueDto('00');
        this._seconds = new TimeValueDto('00');
        this._isValid = true;
    }

    get hour(): TimeValueDto { return this._hour }
    setHour(value: string) { this._hour.setValue(value); }

    get minutes(): TimeValueDto { return this._minutes }
    setMinutes(value: string) { this._minutes.setValue(value); }

    get seconds(): TimeValueDto { return this._seconds }
    setSeconds(value: string) { this._seconds.setValue(value); }

    get isValid(): boolean {
        if (this._minutes.hasValue) {
            this._isValid = +this._minutes.value >= 0 && +this._minutes.value <= 60;
            if (!this._isValid) {
                return false;
            }
        }
    
        if (this._seconds) {
          this._isValid = +this._seconds.value >= 0 && +this._seconds.value <= 60;
        }
    
        return this._isValid;
    }

    get isDefault(): boolean {
        return  this._hour.value == this._hour.defaultValue && 
                this._minutes.value == this._minutes.defaultValue &&
                this._seconds.value == this._seconds.defaultValue;
    }

    get isEmpty(): boolean {
        return !this._hour.hasValue && !this._minutes.hasValue && !this._seconds.hasValue;
    }

    getDefaultDto() {
        let timeDto = new PlotPointDto();
        timeDto._hour.setValue(timeDto._hour.defaultValue);
        timeDto._minutes.setValue(timeDto._minutes.defaultValue);
        timeDto._seconds.setValue(timeDto._seconds.defaultValue);
        return timeDto;
    }

    getEmptyDto() {
        let timeDto = new PlotPointDto();
        timeDto._hour.setValue('');
        timeDto._minutes.setValue('');
        timeDto._seconds.setValue('');
        return timeDto;
    }

    setAndGetTime(hour: string, minutes: string, seconds: string) : PlotPointDto {
        this.setHour(hour);
        this.setMinutes(minutes);
        this.setSeconds(seconds);
        return this;
    }
}

export class TimeValueDto {
    private _defaultValue: string;
    private _value: string;
    
    get value(): string { return this._value; }
    setValue(val: string) {this._value = val; }

    get defaultValue(): string { return this._defaultValue; }
    
    get hasValue(): boolean {
        return this.value != '' ;
    }

    constructor(defaultValue: string) {
        this._defaultValue = defaultValue;
        this.setValue('');
    }
}


// export class PlotPointDto {
//     id: string;
//     order: number;
//     time: PlotPointDto;
//     lineCount: number;
// }

// export class PlotFlowDto {
//     plotPoints: PlotPointDto[];
//     isFinished: boolean;
// }

// export class BeatDetailsDto {
//     id: string;
//     order: number;
//     text: string;
//     lineCount: number;
// }

// export class DmoDto {
//     plotFlowDto: PlotFlowDto;
//     beatDetails: BeatDetailsDto[];
// }

export class BeatDto {
    beatId: string;
    order: number;
    plotPoint: PlotPointDto;
    beatText: string;
    lineCount: number; //todo: remove
}

export class DmoDto {
    dmoId: string;
    isFinished: boolean;
    statusString: string;
    beats: BeatDto[];
}

export class DmoDtoAsJson {
    dmoId: string;
    json: string;
}

