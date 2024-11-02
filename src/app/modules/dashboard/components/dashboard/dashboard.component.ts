import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { LoadingService, NotificationService } from "../../../../core";
import { RouteService } from "../../services/route.service";
import { ProductDTO } from "../../interfaces/product.entity";
import { ProductService } from "../../services/product.service";
import { RouteDTO } from "../../interfaces/route.entity";
import { Subject, catchError, takeUntil, forkJoin, finalize, Observable, of } from 'rxjs';
import {
    PaginationData,
    ProductSearchParams,
    RouteSearchParams,
    ShopSearchParams
} from "../../../shared/interface/searchParams.entity";
import {ShopService} from "../../services/shop.service";
import {ShopDTO} from "../../interfaces/shop.entity";

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly routeService = inject(RouteService);
    private readonly productService = inject(ProductService);
    private readonly shopService = inject(ShopService);
    private readonly notification = inject(NotificationService);
    private readonly loading = inject(LoadingService);

    routeDTO: RouteDTO[] = [];
    shopDTO: ShopDTO[] = [];
    productDTO: ProductDTO[] = [];
    pagination: PaginationData = {
        totalItems: 0,
        pageNumber: 1,
        itemsPerPage: 10
    };

    searchParams: RouteSearchParams = {
        items_per_page: '10',
        page_number: '1',
        route_name: '',
        area_name: '',
    };

    productSearchParams: ProductSearchParams = {
        product_name: '',
        base_price: '',
        cost: '',
        warehouse_code: '',
        items_per_page: '10',
        page_number: '1'
    };

    shopSearchParams: ShopSearchParams = {
        shop_code: '',
        short_name: '',
        full_name: '',
        route_name: '',
        warehouse_code: '',
        items_per_page: '10',
        page_number: '1'
    };

    private handleError(message: string): (error: any) => Observable<never> {
        return (error: any) => {
            console.error(error);
            this.notification.showNotification({
                type: 'error',
                message,
                timeout: 4000
            });
            return of();
        };
    }

    private updatePaginationData(response: any): void {
        if (response?.data) {
            this.pagination = {
                totalItems: response.data.totalItems,
                pageNumber: response.data.page,
                itemsPerPage: response.data.itemsPerPage
            };
        }
    }

    private fetchRoute(): Observable<any> {
        return this.routeService.find(this.searchParams, true).pipe(
            catchError(this.handleError('Failed to fetch route'))
        );
    }

    private fetchShops(): Observable<any> {
        return this.shopService.find(this.shopSearchParams, true).pipe(
            catchError(this.handleError('Failed to fetch Shops'))
        );
    }

    private fetchProduct(): Observable<any> {
        return this.productService.find(this.productSearchParams, true).pipe(
            catchError(this.handleError('Failed to fetch products'))
        );
    }

    private loadData(): void {
        this.loading.setLoading(true);

        forkJoin({
            routes: this.fetchRoute(),
            products: this.fetchProduct(),
            shops: this.fetchShops()

        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading.setLoading(false))
        ).subscribe({
            next: ({ routes, shops, products }) => {
                if (routes?.data) {
                    this.routeDTO = routes.data.data ?? [];
                    this.updatePaginationData(routes);
                }

                if (shops?.data) {
                    this.shopDTO = shops.data.data ?? [];
                }

                if (products?.data) {
                    this.productDTO = products.data.data ?? [];
                }
            }
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}