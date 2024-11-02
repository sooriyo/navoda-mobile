export interface SearchParams {
    items_per_page: string;
    page_number: string;
    [key: string]: string;
}

export interface RouteSearchParams extends SearchParams {
    route_name: string;
    area_name: string;
}

export interface ProductSearchParams extends SearchParams {
    product_name: string;
    base_price: string;
    cost: string;
    warehouse_code: string;
}

export interface ShopSearchParams extends SearchParams {
    shop_code: string;
    short_name: string;
    full_name: string;
    route_name: string;

}

export interface PaginationData {
    totalItems: number;
    pageNumber: number;
    itemsPerPage: number;
}


export const ITEMS_PER_PAGE = '10';
export const INITIAL_PAGE = '1';