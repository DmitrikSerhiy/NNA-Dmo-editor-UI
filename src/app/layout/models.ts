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

export class ShortDmoDtoAPI {
    Id: string;
    Name: string;
    MovieTitle: string;
    ShortComment: string;
    HasBeats: boolean;
    DmoStatus: number;

    constructor(dto: ShortDmoDto) {
        this.Id = dto.id;
        this.Name = dto.name;
        this.DmoStatus = dto.dmoStatus;
        this.HasBeats = dto.hasBeats;
        this.MovieTitle = dto.movieTitle;
        this.ShortComment = dto.shortComment;
    }
}
export class ShortDmoDto {
    id: string;
    name: string;
    movieTitle: string;
    shortComment: string;
    hasBeats: boolean;
    dmoStatus: number;

    constructor(dto: ShortDmoDtoAPI) {
        this.id = dto.Id;
        this.name = dto.Name;
        this.dmoStatus = dto.DmoStatus;
        this.hasBeats = dto.HasBeats;
        this.movieTitle = dto.MovieTitle;
        this.shortComment = dto.ShortComment;
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

