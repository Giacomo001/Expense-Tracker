import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { ExpenseCreate, ExpenseRead, ExpenseUpdate } from '../models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getExpenses(): Observable<ExpenseRead[]> {
    return this.http.get<ExpenseRead[]>(`${this.baseUrl}/expenses`);
  }

  getExpenseById(id: string): Observable<ExpenseRead> {
    return this.http.get<ExpenseRead>(`${this.baseUrl}/expenses/${id}`);
  }

  createExpense(expense: ExpenseCreate): Observable<ExpenseRead> {
    return this.http.post<ExpenseRead>(`${this.baseUrl}/expenses`, expense);
  }

  updateExpense(id: string, expense: ExpenseUpdate): Observable<ExpenseRead> {
    return this.http.put<ExpenseRead>(`${this.baseUrl}/expenses/${id}`, expense);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/expenses/${id}`);
  }
}
