import {Component, inject, OnInit, OnDestroy, effect, signal} from '@angular/core';
import { FormsModule } from "@angular/forms";
import { LoadingService, NotificationService } from "../../../../core";
import { RouteService } from "../../services/route.service";
import { RouteDTO } from "../../interfaces/route.entity";
import { Storage } from '@capacitor/storage';
import { Subject, catchError, takeUntil, forkJoin, finalize, Observable, of } from 'rxjs';
import {
    INITIAL_PAGE,
    ITEMS_PER_PAGE,
    PaginationData,
    RouteSearchParams,
    ShopSearchParams
} from "../../../shared/interface/searchParams.entity";
import {ShopService} from "../../services/shop.service";
import {Cart, CartItem, ProductVariantDTO, ShopDataDTO, ShopDTO, ShopProductDTO} from "../../interfaces/shop.entity";
import {OrderService} from "../../services/order.service";

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
    private readonly orderService = inject(OrderService);
    private readonly notification = inject(NotificationService);
    private readonly loading = inject(LoadingService);
    private readonly dialog = inject(MatDialog);

    isRouteSelected: boolean = false;

    $$selectedShop = signal<number | null>(null);
    $$shopData = signal<ShopDataDTO | null>(null);
    $$isLoading = signal(false);
    $$selectedProduct = signal<ShopProductDTO | null>(null);
    $$cart = signal<Cart>({ items: [], total: 0 });
    $$quantity = signal<number>(0);
    $$selectedSize = signal<ProductVariantDTO | null>(null);
    $$paymentMethod = signal<'cash' | 'credit' | 'cheque' | 'bill' | null>(null);
    $$isRouteSelected = signal<boolean>(false);

    selectedRouteName: string | undefined;
    searchText = '';
    isListVisible = false;
    filteredShops: ShopDTO[] = [];

    routeDTO: RouteDTO[] = [];
    shopDTO: ShopDTO[] = [];


    pagination: PaginationData = {
        totalItems: 0,
        pageNumber: 1,
        itemsPerPage: 10
    };

    routeSearchParams: RouteSearchParams = {
        route_name: '',
        area_name: '',
        items_per_page: ITEMS_PER_PAGE,
        page_number: INITIAL_PAGE
    };

    shopSearchParams: ShopSearchParams = {
        shop_code: '',
        short_name: '',
        full_name: '',
        route_name: localStorage.getItem('selectedRouteName') || '',
        warehouse_code: '',
        items_per_page: '50',
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
        document.addEventListener('click', (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.relative')) {
                this.isListVisible = false;
            }
        });
        effect(() => {
            if (this.shopDTO.length > 0) {
                this.filteredShops = this.shopDTO;
                this.updateSearchShopText();
            }
        });
    }

    filterShops(searchText: string) {
        if (!searchText.trim()) {
            this.filteredShops = this.shopDTO;
            return;
        }

        const search = searchText.toLowerCase();
        this.filteredShops = this.shopDTO.filter(shop =>
            shop.shopCode.toLowerCase().includes(search) ||
            shop.fullName.toLowerCase().includes(search) ||
            (shop.shortName && shop.shortName.toLowerCase().includes(search))
        );
    }

    updateSearchShopText() {
        if (this.$$selectedShop()) {
            const selectedShop = this.shopDTO.find(shop => shop.id === this.$$selectedShop());
            if (selectedShop) {
                this.searchText = `${selectedShop.shopCode} - ${selectedShop.shortName || selectedShop.fullName}`;
            }
        }
    }

    toggleDropdown(event: Event) {
        event.stopPropagation();
        this.isListVisible = !this.isListVisible;
        if (this.isListVisible) {
            this.filteredShops = this.shopDTO;
        }
    }

    private handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.shop-dropdown-container')) {
            this.isListVisible = false;
        }
    };

    handleShopChange(shop: ShopDTO) {
        if (shop?.id) {
            this.$$selectedShop.set(shop.id);
            this.$$selectedProduct.set(null);
            this.$$isLoading.set(true);
            this.isListVisible = false;

            this.searchText = `${shop.shopCode} - ${shop.shortName || shop.fullName}`;

            this.shopService.getById(String(shop.id), true).subscribe({
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

    protected fetchRoute(): Observable<any> {
        return this.routeService.find(this.routeSearchParams, true).pipe(
            catchError(this.handleError('Failed to fetch route'))
        );
    }

    private fetchShops(): Observable<any> {
        return this.shopService.find(this.shopSearchParams, true).pipe(
            catchError(this.handleError('Failed to fetch Shops'))
        );
    }

    protected loadData(): void {
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
        await this.checkStoredRoute();
        this.updateShopSearchParams();
        this.loadData();
    }

    private updateShopSearchParams() {
        this.shopSearchParams = {
            ...this.shopSearchParams,
            route_name: this.selectedRouteName || ''
        };
    }


    async checkStoredRoute() {
        try {
            const { value } = await Storage.get({ key: 'selectedRouteName' });

            // Update to use signal for route selection
            this.$$isRouteSelected.set(!!value);

            if (value) {
                this.selectedRouteName = value;
                // Update localStorage for consistency
                localStorage.setItem('selectedRouteName', value);
            }
        } catch (error) {
            console.error('Error checking stored route:', error);
            this.$$isRouteSelected.set(true);
        }
    }

    async onRouteChange(event: Event): Promise<void> {
        const selectElement = event.target as HTMLSelectElement;
        const selectedRouteId = selectElement.value;
        const selectedRoute = this.routeDTO.find(route => route.name === selectedRouteId);

        if (selectedRoute) {
            // Check if there are items in the cart
            if (this.$$cart().items.length > 0) {
                // Open confirmation dialog
                const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                    width: '350px',
                    data: {
                        title: 'Change Route',
                        message: 'You have items in your cart. Changing the route will clear your cart. Do you want to proceed?'
                    }
                });

                dialogRef.afterClosed().subscribe(async (result) => {
                    if (result) {
                        await this.updateRouteAndResetCart(selectedRoute);
                    }
                });
            } else {
                // If cart is empty, directly update route
                await this.updateRouteAndResetCart(selectedRoute);
            }
        }
    }

    private async updateRouteAndResetCart(selectedRoute: RouteDTO): Promise<void> {
        try {
            // Clear storage
            await Storage.clear();

            // Set new route in storage
            await Storage.set({
                key: 'selectedRouteName',
                value: selectedRoute.name
            });

            // Update component state
            this.selectedRouteName = selectedRoute.name;
            this.$$isRouteSelected.set(true);

            // Reset component state
            this.$$selectedShop.set(null);
            this.$$shopData.set(null);
            this.$$cart.set({ items: [], total: 0 });
            this.$$paymentMethod.set(null);

            // Update shop search params
            this.shopSearchParams = {
                ...this.shopSearchParams,
                route_name: this.selectedRouteName || ''
            };

            // Reload data
            this.loadData();

        } catch (error) {
            console.error('Error changing route:', error);
            this.notification.showNotification({
                type: 'error',
                message: 'Failed to change route',
                timeout: 4000
            });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        document.removeEventListener('click', this.handleClickOutside);
    }

    async switchRoute() {
        try {
            this.$$isRouteSelected.set(false);
            this.$$selectedShop.set(null);
            this.$$shopData.set(null);
            this.$$cart.set({ items: [], total: 0 });

            this.shopSearchParams = {
                ...this.shopSearchParams,
                route_name: this.selectedRouteName || ''
            };

            this.loadData();

        } catch (error) {
            console.error('Error switching route:', error);
        }
    }

    //Current Order create
    handleVariantChange(event: Event) {
        const variantId = Number((event.target as HTMLSelectElement).value);
        if (variantId && this.$$selectedProduct()) {
            const selectedVariant = this.$$selectedProduct()?.productVariants.find(
                v => v.productVariantId === variantId
            );
            this.$$selectedSize.set(selectedVariant || null);
        }
    }

    handleQuantityChange(event: Event) {
        const quantity = Number((event.target as HTMLInputElement).value);
        if (quantity > 0) {
            this.$$quantity.set(quantity);
        }
    }

    addToCart() {
        const product = this.$$selectedProduct();
        const variant = this.$$selectedSize();
        const quantity = this.$$quantity();

        if (product && variant && quantity > 0) {
            const cartItem: CartItem = {
                productId: product.productId,
                productName: product.productName,
                variantId: variant.productVariantId,
                weight: variant.weight,
                quantity: quantity,
                price: variant.price,
                total: variant.price * quantity
            };

            const currentCart = this.$$cart();
            const existingItemIndex = currentCart.items.findIndex(
                item => item.productId === cartItem.productId && item.variantId === cartItem.variantId
            );

            if (existingItemIndex > -1) {
                // Update existing item
                currentCart.items[existingItemIndex].quantity += quantity;
                currentCart.items[existingItemIndex].total =
                    currentCart.items[existingItemIndex].price *
                    currentCart.items[existingItemIndex].quantity;
            } else {
                // Add new item
                currentCart.items.push(cartItem);
            }

            // Update cart total
            currentCart.total = currentCart.items.reduce((sum, item) => sum + item.total, 0);
            this.$$cart.set({ ...currentCart });

            // Reset selections
            this.$$quantity.set(0);
            this.$$selectedSize.set(null);
            this.$$selectedProduct.set(null);
        }
    }

    removeFromCart(productId: number, variantId: number) {
        const currentCart = this.$$cart();
        currentCart.items = currentCart.items.filter(
            item => !(item.productId === productId && item.variantId === variantId)
        );
        currentCart.total = currentCart.items.reduce((sum, item) => sum + item.total, 0);
        this.$$cart.set({ ...currentCart });
    }

    setPaymentMethod(method: 'cash' | 'credit' | 'cheque' | 'bill') {
        this.$$paymentMethod.set(method);
    }

    completeOrder() {
        if (this.$$cart().items.length === 0) {
            this.notification.showNotification({
                type: 'error',
                message: 'Cart is empty',
                timeout: 4000
            });
            return;
        }

        if (!this.$$paymentMethod()) {
            this.notification.showNotification({
                type: 'error',
                message: 'Please select a payment method',
                timeout: 4000
            });
            return;
        }

        const shopId = this.$$selectedShop();
        if (!shopId) {
            this.notification.showNotification({
                type: 'error',
                message: 'No shop selected',
                timeout: 4000
            });
            return;
        }

        const orderItems = this.$$cart().items.map(item => ({
            quantity: item.quantity,
            productId: item.productId,
            price: item.price,
            variantId: item.variantId
        }));

        const orderPayload = {
            orderDate: new Date().toISOString().split('T')[0],
            order_status: '',
            shopId: shopId,
            salesRep: 1,
            createdBy: 1,
            paymentType: this.$$paymentMethod(),
            orderItems: orderItems
        };

        this.loading.setLoading(true);

        this.orderService.orderCreate(orderPayload)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.loading.setLoading(false))
            )
            .subscribe({
                next: (response) => {
                    this.notification.showNotification({
                        type: 'success',
                        message: 'Order created successfully',
                        timeout: 4000
                    });
                    this.cancelOrder();
                },
                error: (error) => {
                    this.notification.showNotification({
                        type: 'error',
                        message: error.message || 'Failed to create order',
                        timeout: 4000
                    });
                }
            });
    }

    cancelOrder() {
        this.$$cart.set({ items: [], total: 0 });
        this.$$paymentMethod.set(null);
    }


}