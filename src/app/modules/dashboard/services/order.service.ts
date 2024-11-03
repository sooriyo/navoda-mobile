import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {APIRequestResources, CachedAPIRequest, PaginationResponse} from "../../../core";
import {BehaviorSubject, tap} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";
import {Router} from "@angular/router";
import {ShopDataDTO, ShopDTO} from "../interfaces/shop.entity";

@Injectable({
    providedIn: 'root'
})
export class OrderService extends CachedAPIRequest {

    $orderAll = new BehaviorSubject<ShopDTO[]>([]);
    all = toSignal(this.$orderAll, {initialValue: []});

    constructor(protected override http: HttpClient, private router: Router) {
        super(http, APIRequestResources.OrderService)
    }


    orderCreate = (order: any) => {
        return this.post<any>(order, {}).pipe(
            tap(() => {
                this.$orderAll.next([])
            })
        );
    }
}