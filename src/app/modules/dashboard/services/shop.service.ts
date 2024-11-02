import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {APIRequestResources, CachedAPIRequest, PaginationResponse} from "../../../core";
import {BehaviorSubject, tap} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";
import {Router} from "@angular/router";
import {ShopDataDTO, ShopDTO} from "../interfaces/shop.entity";
import {VisitorDTO} from "../interfaces/visitor.entity";

@Injectable({
    providedIn: 'root'
})
export class ShopService extends CachedAPIRequest {

    $shopAll = new BehaviorSubject<ShopDTO[]>([]);
    all = toSignal(this.$shopAll, {initialValue: []});

    $active = new BehaviorSubject<ShopDataDTO | undefined>(undefined);
    active = toSignal(this.$active, {initialValue: undefined});

    constructor(protected override http: HttpClient, private router: Router) {
        super(http, APIRequestResources.ShopService)
    }


    find = (searchParams: any, refresh = false) => {
        return this.get<PaginationResponse<ShopDTO[]>>({
            endpoint: `/find`,
            params: searchParams,
        }, refresh ? 'freshness' : 'performance')
            .pipe(tap((res) => this.$shopAll.next(res.data.data)),)
    }

    getById = (id: string, refresh = false) => {
        return this.get<ShopDataDTO>({id}, refresh ? 'freshness' : 'performance')
            .pipe(
                tap((res) => this.$active.next(res.data)),
            );
    }
}
