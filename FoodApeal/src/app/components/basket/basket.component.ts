import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BasketServiceService } from '../../service/basket-service.service';
import { ProductsService } from '../../service/products.service';
import { Product } from '../../models/products.model';
import { PayComponent } from '../pay/pay.component';
import { routes } from '../../app.routes';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, PayComponent, RouterLink],
  templateUrl: './basket.component.html',
  styleUrls: ['./basket.component.scss']
})
export class BasketComponent implements OnInit {
  private basketService = inject(BasketServiceService);
  private productsService = inject(ProductsService);
  private router = inject(Router);
  items = signal<Product[]>([]);
  total = signal<number>(0);
  checkoutError = signal<string | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.items.set(this.basketService.getItems());
    this.total.set(this.basketService.getTotalPrice());
    this.refreshAvailability();
  }

  /** Syncs isAvailable on every basket item from the live products signal */
  private refreshAvailability() {
    const liveProducts = this.productsService.getProducts()();
    this.items().forEach(item => {
      const fresh = liveProducts.find(p => p.Products_id === item.Products_id);
      if (fresh !== undefined) {
        item.isAvailable = fresh.isAvailable;
      }
    });
    // Trigger signal update so the template picks up the change
    this.items.set([...this.items()]);
  }

  remove(item: Product) {
    this.basketService.removeProduct(item);
    this.refresh();
  }

  clear() {
    this.basketService.clearBasket();
    this.refresh();
  }

  increase(item: Product) {
    this.basketService.increase(item);
    this.refresh();
  }

  decrease(item: Product) {
    this.basketService.decrease(item);
    this.refresh();
  }

  imageSrc(item: Product) {
    return item.imageUrl || 'assets/images/baking/3pattrns1.jpg';
  }

  navigateToPayment() {
    // Re-sync availability from the live catalogue before checking
    this.refreshAvailability();
    const unavailable = this.items().filter(item => !item.isAvailable);
    if (unavailable.length > 0) {
      const names = unavailable.map(i => i.Product_name).join(', ');
      this.checkoutError.set(`המוצרים הבאים אינם זמינים כרגע: ${names}. אנא הסר אותם לפני המשך.`);
      return;
    }
    this.checkoutError.set(null);
    this.router.navigate(['/pay']);
  }

}
