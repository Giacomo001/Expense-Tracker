import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExpenseCreate, ExpenseRead, ExpenseUpdate } from '../models/expense.model';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getExpenses(): Observable<ExpenseRead[]> {
    return this.http.get<ExpenseRead[]>(`${this.baseUrl}/expenses`);
  }

  getExpenseById(expenseId: string): Observable<ExpenseRead> {
    return this.http.get<ExpenseRead>(`${this.baseUrl}/expenses/${expenseId}`);
  }

  createExpense(expense: ExpenseCreate): Observable<ExpenseRead> {
    return this.http.post<ExpenseRead>(`${this.baseUrl}/expenses`, expense);
  }

  updateExpense(expenseId: string, expense: ExpenseUpdate): Observable<ExpenseRead> {
    return this.http.put<ExpenseRead>(`${this.baseUrl}/expenses/${expenseId}`, expense);
  }

  deleteExpense(expenseId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/expenses/${expenseId}`);
  }
}
