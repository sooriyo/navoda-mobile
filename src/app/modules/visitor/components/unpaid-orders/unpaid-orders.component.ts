import {Component, OnInit} from '@angular/core';
import {CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";

interface Shop {
  id: number;
  name: string;
}

interface OrderItem {
  product: string;
  size: number;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNo: string;
  shopId: number;
  shopName: string;
  date: Date;
  items: OrderItem[];
  amount: number;
  age: number;
  status: 'pending' | 'paid';
}

@Component({
  selector: 'app-unpaid-orders',
  standalone: true,
  imports: [
    NgForOf,
    NgClass,
    DatePipe,
    FormsModule,
    CurrencyPipe,
    NgIf
  ],
  templateUrl: './unpaid-orders.component.html',
  styleUrl: './unpaid-orders.component.scss'
})
export class UnpaidOrdersComponent implements OnInit {

  // Shop Selection
  shops: Shop[] = [
    {id: 1, name: 'Shop A'},
    {id: 2, name: 'Shop B'},
    {id: 3, name: 'Shop C'}
  ];
  selectedShop: number | null = null;

  // Filters
  searchTerm: string = '';
  dateFilter: string = 'all';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Orders Data
  allOrders: Order[] = [];
  filteredOrders: Order[] = [];

  constructor(private datePipe: DatePipe) {
  }

  ngOnInit() {
    // Simulate loading initial data
    this.loadOrders();
  }

  loadOrders() {
    // Simulated API call to get orders
    // Replace this with actual API call
    this.allOrders = [
      {
        id: 1,
        orderNo: 'ORD0001',
        shopId: 1,
        shopName: 'Shop A',
        date: new Date(2024, 9, 15),
        items: [
          {product: 'Kottu Roti', size: 1, quantity: 2, price: 200},
          {product: 'String Hoppers', size: 1, quantity: 3, price: 300}
        ],
        amount: 500,
        age: this.calculateAge(new Date(2024, 9, 15)),
        status: 'pending'
      },
      // Add more mock orders as needed
    ];

    this.applyFilters();
  }

  onShopChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  calculateAge(orderDate: Date): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - orderDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  applyFilters() {
    let filtered = [...this.allOrders];

    // Apply shop filter
    if (this.selectedShop) {
      filtered = filtered.filter(order => order.shopId === this.selectedShop);
    }

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
          order.orderNo.toLowerCase().includes(search) ||
          order.shopName.toLowerCase().includes(search)
      );
    }

    // Apply date filter
    if (this.dateFilter !== 'all') {
      const days = parseInt(this.dateFilter);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(order => order.date >= cutoffDate);
    }

    // Update pagination
    this.totalItems = filtered.length;
    this.filteredOrders = this.paginateOrders(filtered);
  }

  paginateOrders(orders: Order[]): Order[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return orders.slice(startIndex, endIndex);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.itemsPerPage, this.totalItems);
  }

  get isLastPage(): boolean {
    return this.endIndex >= this.totalItems;
  }

  getTotalOutstanding(): number {
    return this.allOrders.reduce((sum, order) => sum + order.amount, 0);
  }

  getOverdueAmount(): number {
    return this.allOrders
        .filter(order => order.age > 30)
        .reduce((sum, order) => sum + order.amount, 0);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  nextPage() {
    if (!this.isLastPage) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  async markAsPaid(order: Order) {
    try {
      // Simulate API call to mark order as paid
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update local state
      this.allOrders = this.allOrders.filter(o => o.id !== order.id);
      this.applyFilters();

      // Show success message
      console.log(`Order ${order.orderNo} marked as paid`);
    } catch (error) {
      console.error('Error marking order as paid:', error);
    }
  }

  viewDetails(order: Order) {
    // Implement navigation to order details page
    console.log('View details for order:', order);
  }
}