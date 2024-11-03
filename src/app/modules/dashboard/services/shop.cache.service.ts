import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { APIRequestResources, CachedAPIRequest } from "../../../core";
import { BehaviorSubject, from, Observable, tap } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { ShopCacheDTO } from "../interfaces/shop.cache.entity";
import { Storage } from '@capacitor/storage';

@Injectable({
    providedIn: 'root'
})
export class ShopCacheService extends CachedAPIRequest {
    private readonly STORAGE_KEY = 'shop_cache_';
    private readonly ALL_SHOPS_KEY = 'all_shops';

    $shopCacheAll = new BehaviorSubject<ShopCacheDTO[]>([]);
    all = toSignal(this.$shopCacheAll, { initialValue: [] });

    constructor(protected override http: HttpClient, private router: Router) {
        super(http, APIRequestResources.ShopService);
        // this.initializeFromStorage();
    }

    private async initializeFromStorage() {
        try {
            const { value } = await Storage.get({ key: this.ALL_SHOPS_KEY });
            if (value) {
                const shops = JSON.parse(value);
                this.$shopCacheAll.next(shops);
            }
        } catch (error) {
            console.error('Error loading shops from storage:', error);
        }
    }

    private async saveToStorage(routeId: number, shops: ShopCacheDTO[]) {
        try {
            // Save to all shops storage
            await Storage.set({
                key: this.ALL_SHOPS_KEY,
                value: JSON.stringify(shops)
            });
        } catch (error) {
            console.error('Error saving shops to storage:', error);
        }
    }

    private async getFromStorage(routeId: number): Promise<ShopCacheDTO[] | null> {
        try {
            const { value } = await Storage.get({ key: `${this.STORAGE_KEY}${routeId}` });
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Error getting shops from storage:', error);
            return null;
        }
    }

    getByRoute = (routeId: number, refresh = false): Observable<any> => {
        if (!refresh) {
            // Try to get from storage first
            return from(this.getFromStorage(routeId)).pipe(
                tap(async (cachedData) => {
                    if (cachedData) {
                        this.$shopCacheAll.next(cachedData);
                    } else {
                        // If no cached data, fetch from API
                        this.fetchFromAPI(routeId).subscribe();
                    }
                })
            );
        }

        return this.fetchFromAPI(routeId);
    }

    private fetchFromAPI(routeId: number): Observable<any> {
        return this.get<ShopCacheDTO[]>({
            endpoint: `/routes/${routeId}`,
        }, 'freshness').pipe(
            tap(async (res) => {
                this.$shopCacheAll.next(res.data);
                await this.saveToStorage(routeId, res.data);
            })
        );
    }

    async clearCache(routeId?: number) {
        try {
            if (routeId) {
                await Storage.remove({ key: `${this.STORAGE_KEY}${routeId}` });
            } else {
                const keys = await Storage.keys();
                const shopCacheKeys = keys.keys.filter(key => key.startsWith(this.STORAGE_KEY));
                for (const key of shopCacheKeys) {
                    await Storage.remove({ key });
                }
                await Storage.remove({ key: this.ALL_SHOPS_KEY });
            }
            this.$shopCacheAll.next([]);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}