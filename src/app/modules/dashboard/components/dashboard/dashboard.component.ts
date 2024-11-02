import {Component, inject, OnInit, OnDestroy, effect, signal} from '@angular/core';
import { FormsModule } from "@angular/forms";
import { LoadingService, NotificationService } from "../../../../core";
import { RouteService } from "../../services/route.service";
import { ProductDTO } from "../../interfaces/product.entity";
import { ProductService } from "../../services/product.service";
import { RouteDTO } from "../../interfaces/route.entity";
import { Storage } from '@capacitor/storage';
import { Subject, catchError, takeUntil, forkJoin, finalize, Observable, of } from 'rxjs';
import {
    INITIAL_PAGE,
    ITEMS_PER_PAGE,
    PaginationData,
    ProductSearchParams,
    RouteSearchParams,
    ShopSearchParams
} from "../../../shared/interface/searchParams.entity";
import {ShopService} from "../../services/shop.service";
import {ShopDataDTO, ShopDTO, ShopProductDTO} from "../../interfaces/shop.entity";

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
    private readonly shopService = inject(ShopService);
    private readonly notification = inject(NotificationService);
    private readonly loading = inject(LoadingService);

    isRouteSelected: boolean = false;
    $$selectedShop = signal<number | null>(null);
    $$shopData = signal<ShopDataDTO | null>(null);
    $$isLoading = signal(false);
    $$selectedProduct = signal<ShopProductDTO | null>(null);

    selectedRouteName: string | undefined;

    routeDTO: RouteDTO[] = [];
    shopDTO: ShopDTO[] = [];
    productDTO: ShopProductDTO[] = [];


    pagination: PaginationData = {
        totalItems: 0,
        pageNumber: 1,
        itemsPerPage: 10
    };

    routeSearchParams: RouteSearchParams = {
        route_name: '',
        area_name: '',
        items_per_page: ITEMS_PER_PAGE,
        page_number: INITIAL_PAGE,
    };

    productSearchParams: ProductSearchParams = {
        product_name: '',
        base_price: '',
        cost: '',
        warehouse_code: '',
        items_per_page: ITEMS_PER_PAGE,
        page_number: INITIAL_PAGE
    };

    shopSearchParams: ShopSearchParams = {
        shop_code: '',
        short_name: '',
        full_name: '',
        route_name: localStorage.getItem('selectedRouteName') || '',
        warehouse_code: '',
        items_per_page: ITEMS_PER_PAGE,
        page_number: INITIAL_PAGE
    };

    constructor() {
        effect(() => {
                const shop = this.shopService.active()
                if (shop) {
                    this.$$selectedShop.set(shop.shopId || 0);
                }
            }, {allowSignalWrites: true}
        );
    }

    handleShopChange(event: Event) {
        const shopId = (event.target as HTMLSelectElement).value;
        if (shopId) {
            this.$$selectedShop.set(Number(shopId));
            this.$$selectedProduct.set(null);
            this.$$isLoading.set(true);

            this.shopService.getById(String(this.$$selectedShop()), true).subscribe({
                next: (response) => {
                    this.$$shopData.set(response.data);
                    this.$$isLoading.set(false);
                },
                error: () => {
                    this.$$isLoading.set(false);
                }
            });
        }
    }


    handleVariantChange(event: Event) {
        const variantId = Number((event.target as HTMLSelectElement).value);
        if (variantId && this.$$selectedProduct()) {
            const selectedVariant = this.$$selectedProduct()?.productVariants.find(
                v => v.productVariantId === variantId
            );
        }
    }

    handleProductChange(event: Event) {
        const productId = Number((event.target as HTMLSelectElement).value);
        if (productId && this.$$shopData()) {
            const product = this.$$shopData()?.products.find(p => p.productId === productId);
            this.$$selectedProduct.set(product || null);
        } else {
            this.$$selectedProduct.set(null);
        }
    }
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
        return this.routeService.find(this.routeSearchParams, true).pipe(
            catchError(this.handleError('Failed to fetch route'))
        );
    }

    private fetchShops(): Observable<any> {
        return this.shopService.find(this.shopSearchParams, true).pipe(
            catchError(this.handleError('Failed to fetch Shops'))
        );
    }

    private loadData(): void {
        this.loading.setLoading(true);

        forkJoin({
            routes: this.fetchRoute(),
            shops: this.fetchShops()

        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading.setLoading(false))
        ).subscribe({
            next: ({ routes, shops }) => {
                if (routes?.data) {
                    this.routeDTO = routes.data.data ?? [];
                    this.updatePaginationData(routes);
                }

                if (shops?.data) {
                    this.shopDTO = shops.data.data ?? [];
                }

            }
        });
    }

    async ngOnInit() {
        this.loadData();
        await this.checkStoredRoute();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Set Route to capacitor storage and check availability
    async onRouteChange(event: Event): Promise<void> {
        const selectElement = event.target as HTMLSelectElement;
        const selectedRouteId = selectElement.value;
        const selectedRoute = this.routeDTO.find(route => route.name === selectedRouteId);

        if (selectedRoute) {
            this.selectedRouteName = selectedRoute.name;
            try {
                await Storage.set({
                    key: 'selectedRouteName',
                    value: this.selectedRouteName
                });
                this.isRouteSelected = false;
            } catch (error) {
            }
        }
    }

    async checkStoredRoute() {
        try {
            const { value } = await Storage.get({ key: 'selectedRouteName' });
            this.isRouteSelected = !value;
        } catch (error) {
            this.isRouteSelected = true;
        }
    }
}