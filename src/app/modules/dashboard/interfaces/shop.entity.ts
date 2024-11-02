export interface ShopDTO{
    id:  number
    area:  string
    fullName: string
    shopCode: string
    routeName?: string
    shortName?: string
}

export interface ShopDataDTO {
    shopId: number;
    shopCode: string;
    fullName: string;
    shopName: string;
    address: string;
    mobile: string;
    routeId: number;
    status: string;
    products: ShopProductDTO[];
}

export interface ShopProductDTO {
    unit: string;
    productId: number;
    shopPrices: ShopPriceDTO[];
    productCost: number;
    productName: string;
    warehouseId: number;
    productVariants: ProductVariantDTO[];
    productBasePrice: number;
    productDescription: string;
}

export interface ShopPriceDTO {
    price: number;
    productId: number;
    shopPriceId: number;
}

export interface ProductVariantDTO {
    price: number;
    weight: number;
    productName: string;
    productVariantId: number;
}


export interface CartItem {
    productId: number;
    productName: string;
    variantId: number;
    weight: number;
    quantity: number;
    price: number;
    total: number;
}

export interface Cart {
    items: CartItem[];
    total: number;
    paymentMethod?: 'cash' | 'credit';
}