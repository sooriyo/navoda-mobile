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

export interface PaginationData {
    totalItems: number;
    pageNumber: number;
    itemsPerPage: number;
}

