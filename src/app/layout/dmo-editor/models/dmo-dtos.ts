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

export class NnaBeatTimeDto {
    hours: number;
    minutes: number;
    seconds: number;
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
}

export class RemoveBeatDtoAPI {
    Id: string;
    DmoId: string;

    constructor(dto: RemoveBeatDto) {
        this.Id = dto.id;
        this.DmoId = dto.dmoId;
    }
}

