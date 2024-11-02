import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {APIRequestResources, CachedAPIRequest, PaginationResponse} from "../../../core";
import {BehaviorSubject, tap} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";
import {Router} from "@angular/router";
import {ProductDTO} from "../interfaces/product.entity";

@Injectable({
    providedIn: 'root'
})
export class ProductService extends CachedAPIRequest {

    $productAll = new BehaviorSubject<ProductDTO[]>([]);
    all = toSignal(this.$productAll, {initialValue: []});

    constructor(protected override http: HttpClient, private router: Router) {
        super(http, APIRequestResources.ProductService)
    }


    find = (searchParams: any, refresh = false) => {
        return this.get<PaginationResponse<ProductDTO[]>>({
            endpoint: `/find`,
            params: searchParams,
        }, refresh ? 'freshness' : 'performance')
            .pipe(
                tap((res) => this.$productAll.next(res.data.data)),
            )
    }

}
