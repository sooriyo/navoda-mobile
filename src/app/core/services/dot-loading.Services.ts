import {Injectable, signal} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DotLoadingServices {
    isLoading = signal(true);

    setLoading(loading: boolean) {
        this.isLoading.set(loading);
    }
}