import { Time } from '@angular/common';

export interface BeatDto {
    id: string;
    description: string;
    order: number;
    plotTimeSpot: Time;
}

export interface PartialDmoUpdateDto {
    beats: BeatDto[];
    id: string;
}
