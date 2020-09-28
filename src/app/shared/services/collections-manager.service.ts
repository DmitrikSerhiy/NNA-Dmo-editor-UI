import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

  setCollectionId(collectionId: string) {
    this.currentCollectionId = collectionId;
    this.currentCollectionIdSource.next(collectionId);
  }

  getCurrentCollectionId() {
    return this.currentCollectionId;
  }
}
