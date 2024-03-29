import { NnaTagInBeatDto } from "../../models";
import { DmoList } from "../helpers/dmo-list";

export class NnaDmoDto {
    dmoId: string;
    beats: NnaBeatDto[];
    characters: NnaMovieCharacterInDmoDto[];

    constructor(dmoId: string) {
        this.dmoId = dmoId;
        this.beats = [];
        this.characters = [];
    }
   
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
    characters: NnaMovieCharacterInDmoDto[];
}

export class NnaMovieCharacterDto {
    id: string;
    name: string;
    aliases: string;
    color: string;
}

export class NnaMovieCharacterInDmoDto {
    id: string;
    name: string;
    aliases: string;
    count: number;
    color: string;

    goal?: string;
    unconsciousGoal?: string;
    characterBeatIds?: string[];
    characterization?: string;
    characterContradictsCharacterization: boolean;
    characterContradictsCharacterizationDescription?: string;
    emphathetic?: boolean;
    emphatheticDescription?: string;
    sympathetic?: boolean;
    sympatheticDescription?: string;
}

export class NnaMovieCharacterToCreateDto {
    dmoId: string;
    name: string;
    aliases?: string;
    color: string;
    goal?: string;
    unconsciousGoal?: string;
    characterization?: string;
    characterContradictsCharacterization: boolean;
    characterContradictsCharacterizationDescription?: string;
    emphathetic: boolean;
    emphatheticDescription?: string;
    sympathetic: boolean;
    sympatheticDescription?: string;
}

export class NnaMovieCharacterToUpdateDto {
    dmoId: string;
    name: string;
    aliases: string;
    color: string;
    goal?: string;
    unconsciousGoal?: string;
    characterization?: string;
    characterContradictsCharacterization: boolean;
    characterContradictsCharacterizationDescription?: string;
    emphathetic: boolean;
    emphatheticDescription?: string;
    sympathetic: boolean;
    sympatheticDescription?: string;
}

export class NnaMovieCharacterInBeatDto {
    id: string;
    characterId: string;
    name: string;
    color: string;
}

export class NnaBeatDto {
    beatId: string;
    text: string;
    order: number;
    time: NnaBeatTimeDto;
    type: number;
    charactersInBeat: NnaMovieCharacterInBeatDto[];
    tagsInBeat: NnaTagInBeatDto[];
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

export class AttachCharacterToBeatDtoAPI {
    Id: string;
    DmoId: string;
    BeatId: string;
    CharacterId: string;

    constructor(id: string, dmoId: string, beatId: string, characterId: string) {
        this.Id = id;
        this.DmoId = dmoId;
        this.BeatId = beatId;
        this.CharacterId = characterId;
    }
}

export interface AttachTagToBeatDtoAPI {
    Id: string;
    DmoId: string;
    BeatId: string;
    TagId: string;
}

export interface DetachTagFromBeatDtoAPI {
    Id: string;
    DmoId: string;
    BeatId: string;
}

export class DetachCharacterFromBeatDtoAPI {
    Id: string;
    DmoId: string;
    BeatId: string;

    constructor(id: string, dmoId: string, beatId: string) {
        this.Id = id;
        this.DmoId = dmoId;
        this.BeatId = beatId;
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
    charactersInBeat: NnaMovieCharacterInBeatDto[];
    tagsInBeat: NnaTagInBeatDto[];
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

export class BeatToSwapDto {
    id: string;
    order: number;

    constructor(id: string, order: number) {
        this.id = id;
        this.order = order;
    }
}

export class BeatsToSwapDto {
    dmoId: string;
    beatToMove: BeatToSwapDto;
    beatToReplace: BeatToSwapDto;

    constructor(beatToMove: BeatToSwapDto, beatToReplace: BeatToSwapDto) {
        this.beatToMove = beatToMove;
        this.beatToReplace = beatToReplace;
    }
}

export class BeatToMoveDto {
    dmoId: string;
    id: string;
    order: number;
    previousOrder: number;

    constructor(id: string, order: number, previousOrder: number) {
        this.id = id;
        this.order = order;
        this.previousOrder = previousOrder;
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

export const NnaCharacterTagName: string = 'nna-character';
export const NnaCharacterInterpolatorPrefix: string = `{{${NnaCharacterTagName}-`;
export const NnaCharacterInterpolatorPostfix: string = `-${NnaCharacterTagName}}}`;
export const NnaTagElementName: string = 'nna-tag';
export const NnaTagInterpolatorPrefix: string = `{{${NnaTagElementName}-`;
export const NnaTagInterpolatorPostfix: string = `-${NnaTagElementName}}}`;

