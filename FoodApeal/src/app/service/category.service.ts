import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models/category.model';
import { environment } from '../../environments/environment';

interface CategoryDTO {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;
  private categoriesSignal = signal<Category[]>([]);

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  private loadCategories() {
    this.http.get<CategoryDTO[]>(this.apiUrl).subscribe({
      next: (dtos) => this.categoriesSignal.set(
        dtos.map(d => ({ Category_Id: d.id, Category_name: d.name }))
      ),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  // Return a read-only view of all categories
  getCategories() {
    return this.categoriesSignal.asReadonly();
  }
}
