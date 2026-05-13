import { Injectable } from '@angular/core';
import { Product } from '../models/products.model';

@Injectable({
  providedIn: 'root'
})
export class BasketServiceService {
  private items: Product[] = [];
  private totalPrice: number = 0;
  private storageKey = 'basket';

  constructor() {
    this.getItems();
    this.loadFromSession();
  }

  public getItems(): Product[] {
    return this.items;
  }

  addProductTBasket(product: Product, quantity: number = 1) {
    this.addProduct(product, quantity);
  }

  removeProduct(product: Product) {
    const index = this.items.findIndex(p => p.Products_id === product.Products_id);
    if (index > -1) {
      this.items.splice(index, 1);
      this.totalPrice -= product.price;
      if (this.totalPrice < 0) this.totalPrice = 0;
    }
    this.items = this.items.filter(p => p.Products_id !== product.Products_id);
    this.saveToSession();
  }

  clearBasket(): void {
    this.items = [];
    this.totalPrice = 0;
    this.items = [];
    sessionStorage.removeItem(this.storageKey);
  }

  private saveToSession() {
    sessionStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  private loadFromSession() {
    const data = sessionStorage.getItem(this.storageKey);
    const parsed: Product[] = data ? JSON.parse(data) : [];
    this.items = parsed.map(item => ({
      ...item,
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
    }));
  }

  addProduct(product: Product, quantity: number = 1) {
    const existing = this.items.find(p => p.Products_id === product.Products_id);

    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + quantity;
    } else {
      this.items.push({ ...product, quantity });
    }

    this.saveToSession();
  }

  getTotalPrice(): number {
  return this.items.reduce((sum, item) => 
    sum + (item.price * (item.quantity || 1)), 0);
}

  increase(product: Product) {
    const item = this.items.find(p => p.Products_id === product.Products_id);
    if (item) {
      const nextQty = (item.quantity ?? 1) + 1;
      this.items = this.items.map(p =>
        p.Products_id === product.Products_id ? { ...p, quantity: nextQty } : p
      );
      this.saveToSession();
    }
  }

  decrease(product: Product) {
    const item = this.items.find(p => p.Products_id === product.Products_id);
    if (item) {
      const nextQty = (item.quantity ?? 1) - 1;
      if (nextQty <= 0) {
        this.removeProduct(product);
        return;
      }
      this.items = this.items.map(p =>
        p.Products_id === product.Products_id ? { ...p, quantity: nextQty } : p
      );
      this.saveToSession();
    }
  }
}
