export enum RightMenues {
    none = 'none',
    dmoCollections = 'dmoCollections',
    dmos = 'dmos',
    dmo = 'dmo',
    userCabinet = 'userCabinet',
    tags = 'tags'
    // test = 'test'
}

export enum SidebarTabs {
    none = 'none',
    dmoCollections = 'dmoCollections',
    dmos = 'dmos',
    dmo = 'dmo',
    comunity = 'comunity',
    userCabinet = 'userCabinet'
    // test = 'test'
}

export class DmoCollectionShortDto {
    id: string;
    dmoCount: number;
    collectionName: string;
}

export class DmoDto {
    id: string;
    name: string;
    movieTitle: string;
    dmoStatus: string;
    dmoStatusId: number;
    shortComment: string;
    mark: number;

    constructor() {}
}

export class CretedDmoDtoAPI {
    Id: string;
    Name: string;
    MovieTitle: string;
    ShortComment: string;
    published: boolean;

    HasBeats: boolean;
    DmoStatus: number;

    constructor() {
        this.HasBeats = false;
    }
}

export class ShortDmoDto {
    id: string;
    name: string;
    movieTitle: string;
    shortComment: string;
    hasBeats: boolean;
    dmoStatus: number;
}

export class ShortDmoCollectionDto {
    collectionName: string;
    dmos: ShortDmoDto[];
}

export class DmoCollectionDto {
    id: string;
    collectionName: string;
    dmos: ShortDmoDto[];
}

export class DmosIdDto {
    constructor(id: string) {
        this.id = id;
    }
    id: string;
}

export class AddDmosToCollectionDto {
    collectionId: string;
    dmos: DmosIdDto[];
}

export interface UpdateDmoDetailsDto {
    movieTitle: string;
    name?: string;
    dmoStatusId: number;
    shortComment?: string;
}

export interface UpdateDmoPlotDetailsDto {
    premise?: string;
    controllingIdea?: string;
    didacticismDescription?: string;
    controllingIdeaId?: number 
    didacticism?: boolean;
}

export interface DmoDetailsShortDto {
    id: string;
    movieTitle: string;
    dmoStatusId: number;
    published: boolean;
}

export interface DmoDetailsDto {
    movieTitle: string;
    name?: string;
    dmoStatusId: number;
    shortComment?: string;

    premise?: string;
    controllingIdea?: string;
    didacticismDescription?: string;
    controllingIdeaId?: number 
    didacticism?: boolean;

    charactersForConflict: DmoCharactersForConflictDto[];
    conflicts: DmoConflictDto[];
}

export interface DmoCharactersForConflictDto {
    characterId: string;
    name: string;
    aliases?: string;
    color: string;
    goal?: string;
}

export interface DmoConflictDto {
    id: string;
    pairId: string;
    characterId: string;
    characterType: number;
    achieved: boolean;
}

export interface NnaTagWithoutDescriptionDto {
    id: string;
    name: string;
}

export interface NnaTagDescriptionDto {
    description: string;
}

export interface NnaTagDto {
    id: string;
    name: string;
    description: NnaTagDescriptionDto;
}

export interface NnaTagInBeatDto {
    id: string;
    tagId: string;
    name: string;
}
