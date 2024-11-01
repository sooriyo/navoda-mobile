import {Injectable, signal} from '@angular/core'
import {BehaviorSubject} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false)
  private _isLoading = signal(false);

  show() {
    this.isLoadingSubject.next(true)
  }

  hide() {
    this.isLoadingSubject.next(false)
  }
  setLoading(state: boolean) {
    this._isLoading.set(state);
  }

  get isLoading() {
    return this.isLoadingSubject.asObservable()
  }
}
