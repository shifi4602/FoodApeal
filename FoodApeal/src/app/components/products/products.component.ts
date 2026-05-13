import { Component, effect, inject, OnInit } from '@angular/core';
import { ProductsService } from '../../service/products.service';
import { CardModule } from 'primeng/card';
import { ButtonModule, } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { addOrEdit } from '../../models/addOrEditEnum.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BasketServiceService } from '../../service/basket-service.service';
import { Product } from '../../models/products.model';
import { FilterComponent } from './filter/filter.component';
import { CATEGORIES } from '../../models/categories.const';
import { CategoryService } from '../../service/category.service';
import { UserService } from '../../service/user.service';



@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CardModule, ButtonModule, FormsModule, CommonModule, RouterModule, FilterComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {

  private productService = inject(ProductsService);
  private basketService = inject(BasketServiceService);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  private userService = inject(UserService);
  addOrEditVal: addOrEdit = 0;

  currentUser = this.userService.getCurrentUser();

  allProducts = this.productService.getProducts();
  filteredProducts: Product[] = [];
  private activeFilter: any = null;
  urlCategories: string[] = [];  // category names for FilterComponent checkboxes
  private urlCategoryIds: number[] = [];  // category IDs for filtering

  private categoriesSignal = this.categoryService.getCategories();

  constructor() {
    // Re-filter when products load from API
    effect(() => {
      const products = this.allProducts().filter(p =>
        p.isAvailable === true &&
        p.Product_name != null && p.Product_name.trim() !== '' &&
        p.price != null && p.price > 0
      );
      if (!this.activeFilter) {
        this.filteredProducts = [...products];
      } else {
        this.filteredProducts = this.filterProducts(products, this.activeFilter);
      }
    });

    // Resolve category names for FilterComponent once categories load from API
    effect(() => {
      const allCats = this.categoriesSignal();
      if (this.urlCategoryIds.length > 0 && allCats.length > 0) {
        this.urlCategories = allCats
          .filter(c => this.urlCategoryIds.includes(c.Category_Id))
          .map(c => c.Category_name);
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const categoryIdParam = params['categoryId'];
      if (categoryIdParam) {
        this.urlCategoryIds = categoryIdParam.split(',').map((id: string) => +id.trim());
        this.activeFilter = { categoryIds: this.urlCategoryIds };
        this.filteredProducts = this.filterProducts(
          this.allProducts().filter(p => p.isAvailable && p.Product_name?.trim() && p.price),
          this.activeFilter
        );
      } else {
        this.urlCategoryIds = [];
        this.urlCategories = [];
        this.resetProducts();
      }
    });
  }


  refresh() {
    this.filteredProducts = [...this.allProducts()];
  }

  private filterProducts(products: Product[], filter: any): Product[] {
    const searchName = (filter.name || '').toLowerCase().trim();
    const searchDescription = (filter.description || '').toLowerCase().trim();
    const categories = filter.categories || [];
    const categoryIds: number[] = filter.categoryIds || [];

    return products.filter(product => {
      if (product.isAvailable !== true || product.Product_name == null || product.Product_name.trim() === '' || product.price == null || product.price <= 0) return false;

      const productName = (product.Product_name || '').toLowerCase();
      const productDescription = (product.description || '').toLowerCase();
      const productCategoryName = product.category_name || CATEGORIES[(product.category_Id ?? 1) - 1];

      const matchesCategoryIds = categoryIds.length === 0 || categoryIds.includes(product.category_Id);
      const matchesCategoryNames = categories.length === 0 || categories.includes(productCategoryName);

      return (
        matchesCategoryIds &&
        matchesCategoryNames &&
        (searchName === '' || productName.includes(searchName)) &&
        (searchDescription === '' || productDescription.includes(searchDescription)) &&
        (filter.maxPrice == null || filter.maxPrice >= 1000 || product.price <= filter.maxPrice)
      );
    });
  }

  onFilterChanged(filter: any) {
    // Always merge the locked URL category IDs into the sidebar filter
    const mergedFilter = { ...filter, categoryIds: this.urlCategoryIds };

    // If ALL backend categories are selected, treat it the same as "no category filter"
    const allCats = this.categoriesSignal();
    if (allCats.length > 0 && mergedFilter.categories?.length >= allCats.length) {
      mergedFilter.categories = [];
    }

    const isEmpty =
      !filter.name &&
      !filter.description &&
      (!mergedFilter.categories || mergedFilter.categories.length === 0) &&
      (filter.maxPrice === undefined || filter.maxPrice >= 1000);

    if (isEmpty && this.urlCategoryIds.length === 0) {
      this.resetProducts();
      return;
    }

    this.activeFilter = mergedFilter;
    this.filteredProducts = this.filterProducts(this.allProducts(), mergedFilter);
  }


  resetProducts() {
    const available = this.allProducts().filter(p =>
      p.isAvailable === true &&
      p.Product_name != null && p.Product_name.trim() !== '' &&
      p.price != null && p.price > 0
    );
    if (this.urlCategoryIds.length > 0) {
      this.activeFilter = { categoryIds: this.urlCategoryIds };
      this.filteredProducts = this.filterProducts(available, this.activeFilter);
    } else {
      this.activeFilter = null;
      this.filteredProducts = [...available];
    }
  }



  addToBasket(product: Product) {
    this.basketService.addProductTBasket(product);
    // optional: simple feedback
    console.log('added to basket', product.Product_name);
  }

  getImageUrl(product: Product): string {
    const url = product.imageUrl?.trim();
    return url ? url : 'assets/no-image.svg';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== window.location.origin + '/assets/no-image.svg') {
      img.src = 'assets/no-image.svg';
    }
    img.onerror = null; // prevent infinite loop
  }

  private router = inject(Router);

  goToProduct(product: Product) {
    this.router.navigate(['/products-page', product.Products_id], {
      state: { product }
    });
  }
}
