export enum RightMenues {
    none = 'none',
    dmoCollections = 'dmoCollections',
    dmos = 'dmos',
    dmo = 'dmo',
    userCabinet = 'userCabinet'
    // test = 'test'
}

export enum SidebarTabs {
    none = 'none',
    dmoCollections = 'dmoCollections',
    dmos = 'dmos',
    dmo = 'dmo',
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

export interface DmoDetailsShortDto {
    id: string;
    movieTitle: string;
    dmoStatusId: number;
}

export interface DmoDetailsDto {
    movieTitle: string;
    name?: string;
    dmoStatusId: number;
    shortComment?: string;
}

