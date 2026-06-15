import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { BudgetCreate, BudgetRead, BudgetUpdate } from '../models/budget.model';

@Injectable({
  providedIn: 'root',
})
export class BudgetsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getBudgetsByUserId(): Observable<BudgetRead[]> {
    return this.http.get<BudgetRead[]>(`${this.baseUrl}/budgets`);
  }

  getBudgetById(budgetId: string): Observable<BudgetRead> {
    return this.http.get<BudgetRead>(`${this.baseUrl}/budgets/${budgetId}`);
  }

  getBudgetByCategoryId(categoryId: string): Observable<BudgetRead> {
    return this.http.get<BudgetRead>(`${this.baseUrl}/budgets/category/${categoryId}`);
  }

  createBudget(budget: BudgetCreate): Observable<BudgetRead> {
    return this.http.post<BudgetRead>(`${this.baseUrl}/budgets`, budget);
  }

  updateBudget(budgetId: string, budget: BudgetUpdate): Observable<BudgetRead> {
    return this.http.put<BudgetRead>(`${this.baseUrl}/budgets/${budgetId}`, budget);
  }

  deleteBudget(budgetId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/budgets/${budgetId}`);
  }
}
