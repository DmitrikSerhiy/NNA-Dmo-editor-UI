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