export enum RightMenues {
    dashboard = 'dashboard',
    dmoCollections = 'dmoCollections',
    dmos = 'dmos',
    dmo = 'dmo',
    // test = 'test'
}

export enum SidebarTabs {
    dashboard = 'dashboard',
    dmoCollections = 'dmoCollections',
    dmos = 'dmos',
    dmo = 'dmo',
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

export class ShortDmoDto {
    id: string;
    name: string;
    movieTitle: string;
    shortComment: string;
    hasBeats: boolean;

    constructor(name: string, movieTitle: string) {
        this.name = name;
        this.movieTitle = movieTitle;
    }
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
    id: string;
}

