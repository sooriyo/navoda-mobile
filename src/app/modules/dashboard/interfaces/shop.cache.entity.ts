export interface ShopCacheDTO {
    mobile: string;
    shopId: number;
    status: string;
    address: string;
    routeId: number;
    fullName: string;
    products: ProductCacheDTO[];
    shopCode: string;
    shortName?: string;
}

export interface ProductCacheDTO {
    unit: string;
    productId: number;
    shopPrices: ShopCachePriceDTO[];
    productCost: number;
    productName: string;
    warehouseId: number;
    productVariants: ProductCacheVariantDTO[];
    productBasePrice: number;
    productDescription: string;
}

export interface ShopCachePriceDTO {
    price: number;
    productId: number;
    shopPriceId: number;
}

export interface ProductCacheVariantDTO {
    price: number;
    weight: number;
    productName: string;
    productVariantId: number;
}
