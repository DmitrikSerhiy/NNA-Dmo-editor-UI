import { DmoList } from "../helpers/dmo-list";

export class NnaDmoDto {
    dmoId: string;
    beats: NnaBeatDto[];
    characters: NnaMovieCharacterDto[];
   
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

export class DmoWithDataDto {
    beats: NnaBeatDto[];
    characters: NnaMovieCharacterDto[];
}

export class NnaMovieCharacterDto {
    id: string;
    name: string;
    aliases: string;
}

export class NnaMovieCharacterToCreateDto {
    dmoId: string;
    name: string;
    aliases: string;
}

export class NnaMovieCharacterToUpdateDto {
    dmoId: string;
    id: string;
    name: string;
    aliases: string;
}

export class NnaBeatDto {
    beatId: string;
    text: string;
    order: number;
    time: NnaBeatTimeDto;
    type: number;
}

export class UpdateBeatDtoAPI {
    BeatId: string;
    Text: string;
    Time: UpdateBeatTimeDtoAPI;
    Type: number;

    constructor(beatDto: NnaBeatDto) {
        this.BeatId = beatDto.beatId;
        this.Text = beatDto.text;
        this.Time = new UpdateBeatTimeDtoAPI(beatDto.time);
        this.Type = beatDto.type;
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
    type: number;
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

export class BeatToMoveDto {
    id: string;
    order: number;

    constructor(id: string, order: number) {
        this.id = id;
        this.order = order;
    }
}

export class BeatsToSwapDto {
    dmoId: string;
    beatToMove: BeatToMoveDto;
    beatToReplace: BeatToMoveDto;

    constructor(beatToMove: BeatToMoveDto, beatToReplace: BeatToMoveDto) {
        this.beatToMove = beatToMove;
        this.beatToReplace = beatToReplace;
    }
}

export class UpdateBeatType {
    beatId: string;
    newType: number;

    constructor(beatId: string, newType: number) {
        this.beatId = beatId;
        this.newType = newType;
    }
}

