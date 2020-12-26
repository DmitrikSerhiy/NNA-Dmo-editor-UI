
export class TimeDto {
    private _hour: TimeValue;
    private _minutes: TimeValue;
    private _seconds: TimeValue;

    constructor() {
        this._hour = new TimeValue('0');
        this._minutes = new TimeValue('00');
        this._seconds = new TimeValue('00');
    }

    get hour(): TimeValue { return this._hour }
    setHour(value: string) { this._hour.setValue(value); }

    get minutes(): TimeValue { return this._minutes }
    setMinutes(value: string) { this._minutes.setValue(value); }

    get seconds(): TimeValue { return this._seconds }
    setSeconds(value: string) { this._seconds.setValue(value); }

    get isDefault(): boolean {
        return  this._hour.value == this._hour.defaultValue && 
                this._minutes.value == this._minutes.defaultValue &&
                this._seconds.value == this._seconds.defaultValue;
    }

    get isEmpty(): boolean {
        return !this._hour.hasValue && !this._minutes.hasValue && !this._seconds.hasValue;
    }

    getDefaultDto() {
        let timeDto = new TimeDto();
        timeDto._hour.setValue(timeDto._hour.defaultValue);
        timeDto._minutes.setValue(timeDto._minutes.defaultValue);
        timeDto._seconds.setValue(timeDto._seconds.defaultValue);
        return timeDto;
    }

    getEmptyDto() {
        let timeDto = new TimeDto();
        timeDto._hour.setValue('');
        timeDto._minutes.setValue('');
        timeDto._seconds.setValue('');
        return timeDto;
    }
}

export class TimeValue {
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