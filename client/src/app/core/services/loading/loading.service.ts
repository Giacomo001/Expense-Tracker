// core/services/loading.service.ts
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  /*
    With a map more loadings are managed without any conflict

    There are two types of 'loading':
    - 'bar' → Blocking operations (submits, deletes, saves) - It shows the bar on top
    - every other key → local loading of a section (ie: 'expenses' or 'categories')
  */
  private _loadingMap = signal<Map<string, boolean>>(new Map());

  isBarLoading = computed(() =>
    //If _loadingMap has at least one field set as TRUE, this gets returned
    //It doesn't work if _loadingMap is empty or every value is FALSE 
    this._loadingMap().get('bar') ?? false
  );

  //It activates the loading for a specific key. 'bar' is the default value
  show(key: string = 'bar') {
    this._loadingMap.update(map => new Map(map).set(key, true));
  }

  //It deactivates the loading for the specific key
  hide(key: string = 'bar') {
    this._loadingMap.update(map => {
      const next = new Map(map);
      next.delete(key);
      return next;
    });
  }

  //Returns a computed signal for the specific key
  isLoading(key: string) {
    return computed(() => this._loadingMap().get(key) ?? false);
  }
}