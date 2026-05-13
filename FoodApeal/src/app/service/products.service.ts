import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Product } from '../models/products.model';
import { environment } from '../../environments/environment';

interface ProductDTO {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  categoryName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private productsSignal = signal<Product[]>([]);

  constructor(private http: HttpClient) {
    this.loadProducts();
  }

  private readonly baseUrl = environment.apiUrl.replace('/api', '');

  private mapDTO(dto: ProductDTO): Product {
    const p = new Product();
    p.Products_id = dto.id;
    p.Product_name = dto.name;
    p.price = dto.price;
    p.category_Id = dto.categoryId;
    p.category_name = dto.categoryName;
    p.description = dto.description;
    const raw = dto.imageUrl;
    if (!raw) {
      p.imageUrl = '';
    } else if (raw.startsWith('http')) {
      // full URL (uploaded via UploadController)
      p.imageUrl = raw;
    } else if (raw.startsWith('assets/') || raw.startsWith('/assets/')) {
      // Angular app asset — use as-is
      p.imageUrl = raw.replace(/^\//, '');
    } else {
      // other relative path — prepend backend base URL
      p.imageUrl = `${this.baseUrl}/${raw.replace(/^\//, '')}`;
    }
    p.isAvailable = dto.isAvailable;
    return p;
  }

  private loadProducts() {
    this.http.get<ProductDTO[]>(this.apiUrl, { params: { skip: 1000, position: 1 } }).subscribe({
      next: (dtos) => this.productsSignal.set(dtos.map(d => this.mapDTO(d))),
      error: (err) => console.error('Failed to load products', err)
    });
  }


  // פונקציה לחשיפת הסיגנל לקריאה בלבד
  getProducts() {
    return this.productsSignal.asReadonly();
  }

  addProduct(product: Product): Observable<Product> {
    const body = {
      id: 0,
      categoryId: product.category_Id,
      name: product.Product_name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable ?? true
    };
    return this.http.post<ProductDTO>(this.apiUrl, body).pipe(
      map(dto => this.mapDTO(dto)),
      tap(newProduct => this.productsSignal.update(list => [...list, newProduct]))
    );
  }

  updateProduct(product: Product): Observable<void> {
    const body = {
      id: product.Products_id,
      categoryId: product.category_Id,
      name: product.Product_name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable ?? true
    };
    return this.http.put<void>(`${this.apiUrl}/${product.Products_id}`, body).pipe(
      tap(() => {
        this.productsSignal.update(list =>
          list.map(p => p.Products_id === product.Products_id ? product : p)
        );
      })
    );
  }

  getProductById(id: number): Product | undefined {
    return this.productsSignal().find(p => p.Products_id === id);
  }

  fetchProductById(id: number): Observable<Product> {
    return this.http.get<ProductDTO>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.mapDTO(dto))
    );
  }

  // Filter products by optional criteria.
  // options:
  // - maxPrice?: number           -> include products with price <= maxPrice
  // - description?: string        -> case-insensitive substring match on Description
  // - categories?: number[]       -> Category_Id included in this array
  // - name?: string               -> case-insensitive substring match on Product_name
  // - orderBy?: 'priceAsc'|'priceDesc'|'nameAsc'|'nameDesc'
  filterProducts(options?: {
    maxPrice?: number;
    description?: string;
    categories?: number[];
    name?: string;
    orderBy?: 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc';
  }): Product[] {
    const { maxPrice, description, categories, name, orderBy } = options || {};

    let result = this.productsSignal();

    if (maxPrice != null) {
      result = result.filter(p => typeof p.price === 'number' ? p.price <= maxPrice : false);
    }

    if (description) {
      const q = description.toLowerCase();
      result = result.filter(p => (p.description || '').toLowerCase().includes(q));
    }

    if (name) {
      const q = name.toLowerCase();
      result = result.filter(p => (p.Product_name || '').toLowerCase().includes(q));
    }

    if (categories && categories.length) {
      result = result.filter(p => categories.includes(p.category_Id));
    }

    if (orderBy) {
      const sorted = result.slice();
      switch (orderBy) {
        case 'priceAsc':
          sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
          break;
        case 'priceDesc':
          sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
          break;
        case 'nameAsc':
          sorted.sort((a, b) => String(a.Product_name).localeCompare(String(b.Product_name)));
          break;
        case 'nameDesc':
          sorted.sort((a, b) => String(b.Product_name).localeCompare(String(a.Product_name)));
          break;
      }
      result = sorted;
    }

    return result;
  }
}
