import {Component, OnInit} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CurrencyPipe, NgForOf, NgIf} from "@angular/common";
import {UnpaidOrdersComponent} from "../unpaid-orders/unpaid-orders.component";
import {UnitService} from "../../services/unit.service";

interface Product {
  name: string;
  sizes: number[];
}

interface CartItem {
  id: number;
  product: string;
  size: number;
  quantity: number;
  price: number;
}

interface Order {
  orderNo: string;
  amount: number;
  items: CartItem[];
  status: 'pending' | 'paid';
}

interface Unit {
  unitId: number;
  unitCode: string;
  unitName: string;
  unitSymbol: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    CurrencyPipe,
    NgIf,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  products: Product[] = [
    { name: 'Kottu Roti', sizes: [1, 2, 5] },
    { name: 'Wet Rice Flour', sizes: [1] },
    { name: 'String Hoppers Flour', sizes: [1] },
    { name: 'Samosa Sheet', sizes: [1] },
    { name: 'Chinese Rolls Sheet', sizes: [1] }
  ];

  selectedProduct: string = '';
  selectedSize: number | null = null;
  quantity: number = 1;
  cart: CartItem[] = [];
  orders: Order[] = [];
  orderCounter: number = 1;

  onProductChange() {
    this.selectedSize = null;
  }

  getProductSizes(): number[] {
    const product = this.products.find(p => p.name === this.selectedProduct);
    return product ? product.sizes : [];
  }

  calculatePrice(product: string, size: number, quantity: number): number {
    // Simple price calculation (replace with actual pricing logic)
    return size * 100 * quantity;
  }

  addToCart() {
    if (this.selectedProduct && this.selectedSize && this.quantity > 0) {
      const price = this.calculatePrice(this.selectedProduct, this.selectedSize, this.quantity);

      this.cart.push({
        id: Date.now(),
        product: this.selectedProduct,
        size: this.selectedSize,
        quantity: this.quantity,
        price: price
      });

      // Reset form
      this.selectedProduct = '';
      this.selectedSize = null;
      this.quantity = 1;
    }
  }

  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter(i => i.id !== item.id);
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price, 0);
  }

  completeOrder() {
    if (this.cart.length > 0) {
      const orderNo = `ORD${this.orderCounter.toString().padStart(4, '0')}`;

      this.orders.push({
        orderNo: orderNo,
        amount: this.getCartTotal(),
        items: [...this.cart],
        status: 'pending'
      });

      this.orderCounter++;
      this.clearCart();
    }
  }

  clearCart() {
    this.cart = [];
  }

  markOrderAsPaid(order: Order) {
    this.orders = this.orders.filter(o => o.orderNo !== order.orderNo);
  }

  units: Unit[] = [];

  constructor(private unitService: UnitService) {}

  ngOnInit(): void {
    this.unitService.getUnits().subscribe({
      next: (data) => this.units = data,
      error: (error) => console.error('Error fetching units:', error)
    });
  }


}