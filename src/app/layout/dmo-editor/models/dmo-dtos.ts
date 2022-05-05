import { DmoList } from "../helpers/dmo-list";

export class NnaDmoDto {
    dmoId: string;
    beats: NnaBeatDto[];
   
    public getBeatsAsLinkedList() : DmoList<NnaBeatDto> {
        let list = new DmoList<NnaBeatDto>();
        if (!this.beats || this.beats.length == 0) {
            return list;
        }

        this.beats.forEach(beat => {
            list.insertEnd(beat);
        });

        return list;
    }
}

export class NnaBeatDto {
    beatId: string;
    text: string;
    order: number;
    time: NnaBeatTimeDto;
}

export class UpdateBeatDtoAPI {
    BeatId: string;
    Text: string;
    Time: UpdateBeatTimeDtoAPI;

    constructor(beatDto: NnaBeatDto) {
        this.BeatId = beatDto.beatId;
        this.Text = beatDto.text;
        this.Time = new UpdateBeatTimeDtoAPI(beatDto.time);
    }
}
export class NnaBeatTimeDto {
    hours: number;
    minutes: number;
    seconds: number;
}

export class UpdateBeatTimeDtoAPI {
    Hours: number;
    Minutes: number;
    Seconds: number;

    constructor(timeDto: NnaBeatTimeDto) {
        this.Hours = timeDto.hours;
        this.Minutes = timeDto.minutes;
        this.Seconds = timeDto.seconds;
    }
}
export class NnaDmoWithBeatsAsJson {
    dmoId: string;
    json: string; 
}

export class NnaDmoWithBeatsAsJsonAPI {
    DmoId: string;
    Data: string; 

    constructor(dto: NnaDmoWithBeatsAsJson) {
        this.DmoId = dto.dmoId;
        this.Data = dto.json;
    }
}

export class CreateBeatDto {
    tempId: string;
    order: number;
    dmoId: string;
}

export class CreateBeatDtoAPI {
    TempId: string;
    Order: number;
    DmoId: string;

    constructor(dto: CreateBeatDto) {
        this.TempId = dto.tempId;
        this.Order = dto.order;
        this.DmoId = dto.dmoId;
    }
}

export class RemoveBeatDto {
    id: string;
    dmoId: string;
    order: number;
}

export class RemoveBeatDtoAPI {
    Id: string;
    DmoId: string;
    Order: number;

    constructor(dto: RemoveBeatDto) {
        this.Id = dto.id;
        this.DmoId = dto.dmoId;
        this.Order = dto.order;
    }
}

