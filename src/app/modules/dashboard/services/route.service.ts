import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {APIRequestResources, CachedAPIRequest, PaginationResponse} from "../../../core";
import {BehaviorSubject, tap} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";
import {Router} from "@angular/router";
import {RouteDTO} from "../interfaces/route.entity";

@Injectable({
    providedIn: 'root'
})
export class RouteService extends CachedAPIRequest {

    $routeAll = new BehaviorSubject<RouteDTO[]>([]);
    all = toSignal(this.$routeAll, {initialValue: []});

    constructor(protected override http: HttpClient, private router: Router) {
        super(http, APIRequestResources.RouteService)
    }


    find = (searchParams: any, refresh = false) => {
        return this.get<PaginationResponse<RouteDTO[]>>({
            endpoint: `/find`,
            params: searchParams,
        }, refresh ? 'freshness' : 'performance')
            .pipe(
                tap((res) => this.$routeAll.next(res.data.data)),
            )
    }

}
