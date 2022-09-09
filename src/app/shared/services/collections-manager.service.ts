import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class CollectionsManagerService {

  private currentCollectionId: string;
  private currentCollectionIdSource: BehaviorSubject<string>;
  currentCollectionObserver: Observable<string>;

  constructor() {
    this.currentCollectionId = '';
    this.currentCollectionIdSource = new BehaviorSubject('');
    this.currentCollectionObserver = this.currentCollectionIdSource.asObservable();
   }

  setCollectionId(collectionId: string, initial: boolean = false) {
    this.currentCollectionId = collectionId;
    if (collectionId == '') {
      return;
    } 

    if (initial) {
      return;
    }

    this.currentCollectionIdSource.next(collectionId);
  }

  getCurrentCollectionId() {
    return this.currentCollectionId;
  }
}
