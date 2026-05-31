import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchResult {
  id: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  category?: string;
  score: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/search`;

  search(query: string): Observable<SearchResult[]> {
    return this.http.post<SearchResult[]>(this.apiUrl, { query });
  }
}
