import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollectionsManagerService {

  private currentCollectionId = '';
  private currentCollectionIdSource = new BehaviorSubject('');
  currentCollectionObserver = this.currentCollectionIdSource.asObservable();

  constructor() { }

  setCollectionId(collectionId: string) {
    this.currentCollectionId = collectionId;
    this.currentCollectionIdSource.next(collectionId);
  }

  getCurrentCollectionId() {
    return this.currentCollectionId;
  }
}
