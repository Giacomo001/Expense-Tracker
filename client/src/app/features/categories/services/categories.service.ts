import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CategoryCreate, CategoryRead, CategoryUpdate } from '../models/category.model';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getCategories(): Observable<CategoryRead[]> {
    return this.http.get<CategoryRead[]>(`${this.baseUrl}/categories`);
  }

  getCategoryById(id: string): Observable<CategoryRead> {
    return this.http.get<CategoryRead>(`${this.baseUrl}/categories/${id}`);
  }

  createCategory(category: CategoryCreate): Observable<CategoryRead> {
    return this.http.post<CategoryRead>(`${this.baseUrl}/categories`, category);
  }

  updateCategory(id: string, category: CategoryUpdate): Observable<CategoryRead> {
    return this.http.put<CategoryRead>(`${this.baseUrl}/categories/${id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }
}
