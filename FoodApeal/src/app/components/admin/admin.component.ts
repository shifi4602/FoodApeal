import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ProductsService } from '../../service/products.service';
import { Product } from '../../models/products.model';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductFormComponent, ButtonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  private productsService = inject(ProductsService);
  private router = inject(Router);

  view: 'list' | 'add' = 'list';
  products: Product[] = [];

  constructor() {
    effect(() => {
      this.products = this.productsService.getProducts()();
    });
  }

  editProduct(id: number): void {
    this.router.navigate(['/product-edit', id]);
  }

  onProductAdded(): void {
    this.view = 'list';
  }
}
