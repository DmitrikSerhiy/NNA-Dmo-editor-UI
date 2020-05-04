import { Time } from '@angular/common';

export interface BeatDto {
    description: string;
    order: number;
    plotTimeSpot: Time;
}

export interface PartialDmoUpdateDto {
    beats: BeatDto[];
    dmoId: string;
}
