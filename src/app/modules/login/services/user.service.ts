import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {APIRequestResources, CachedAPIRequest, PaginationResponse} from "../../../core";
import {BehaviorSubject, tap} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";
import {Router} from "@angular/router";
import {CategoryDTO, UpdateVisitorStatusDTO, VisitorDTO, VisitorSearchResultDTO} from "../interfaces/user.entity";
import {take} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class UserService extends CachedAPIRequest {

  $all = new BehaviorSubject<VisitorSearchResultDTO[]>([]);
  all = toSignal(this.$all, {initialValue: []});

  $categoryAll = new BehaviorSubject<CategoryDTO[]>([]);
  categoryAll = toSignal(this.$categoryAll, {initialValue: []});

  $active = new BehaviorSubject<VisitorDTO | undefined>(undefined);
  active = toSignal(this.$active, {initialValue: undefined});

  constructor(protected override http: HttpClient, private router: Router) {
    super(http, APIRequestResources.ProductService)
    // this.getCategories().pipe(take(1)).subscribe()
  }

  find = (searchParams: any, refresh = false) => {
    return this.get<PaginationResponse<VisitorSearchResultDTO[]>>({
      endpoint: `find`,
      params: searchParams,
    }, refresh ? 'freshness' : 'performance')
      .pipe(
        tap((res) => this.$all.next(res.data.data)),
      )
  }

  create = (gatePass: any) => {
    return this.post<any>(gatePass, {}).pipe(
      tap(() => {
        this.$all.next([])
      })
    );
  }

  update = (id: number, gatePass: any) => {
    const options = {suffix: id.toString()};
    return this.patch<any>(gatePass, options).pipe(
      tap(() => {

      })
    );
  }

  getById = (id: string, refresh = false) => {
    return this.get<VisitorDTO>({id}, refresh ? 'freshness' : 'performance')
      .pipe(
        tap((res) => this.$active.next(res.data)),
      );
  }

  updateStatus = (gatePass: any, id: string) => {
    const options = {suffix: id.toString(), endPoint: 'status'};
    return this.patch<any>(gatePass, options).pipe(
      tap(() => {

      })
    );
  }

  getCategories = (refresh = false) => {
    return this.get<CategoryDTO[]>({
    endpoint:'categories'
    }, refresh ? 'freshness' : 'performance')
      .pipe(
        tap((res) => this.$categoryAll.next(res.data)),
      );
  }

  initial = () => {
    this.$active.next(undefined)
  }

}
