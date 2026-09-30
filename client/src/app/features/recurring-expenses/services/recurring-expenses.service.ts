import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { RecurringExpenseConfirm, RecurringExpenseCreate, RecurringExpenseDue, RecurringExpenseRead, RecurringExpenseUpdate } from '../models/recurring-expense.model';
import { Observable } from 'rxjs';
import { ExpenseRead } from '@features/expenses/models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class RecurringExpensesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getAllRecurringExpensesByUserId(): Observable<RecurringExpenseRead[]> {
    return this.http.get<RecurringExpenseRead[]>(`${this.baseUrl}/recurringexpenses`);
  }

  getDueRecurringExpensesByUserId(): Observable<RecurringExpenseDue[]> {
    return this.http.get<RecurringExpenseDue[]>(`${this.baseUrl}/recurringexpenses/due`);
  }

  getRecurringExpenseById(id: string): Observable<RecurringExpenseRead> {
    return this.http.get<RecurringExpenseRead>(`${this.baseUrl}/recurringexpenses/${id}`);
  }

  createRecurringExpense(recExpense: RecurringExpenseCreate): Observable<RecurringExpenseRead> {
    return this.http.post<RecurringExpenseRead>(`${this.baseUrl}/recurringexpenses`, recExpense);
  }

  updateRecurringExpense(id: string, recExpense: RecurringExpenseUpdate): Observable<RecurringExpenseRead> {
    return this.http.put<RecurringExpenseRead>(`${this.baseUrl}/recurringexpenses/${id}`, recExpense);
  }

  deleteRecurringExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/recurringexpenses/${id}`);
  }

  //Method for the user's input management
  confirmRecurringExpense(id: string, recExpense: RecurringExpenseConfirm): Observable<ExpenseRead> {
    return this.http.post<ExpenseRead>(`${this.baseUrl}/recurringexpenses/${id}/confirm`, recExpense);
  }

  skipRecurringExpense(id:string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/recurringexpenses/${id}/skip`, {});
  }

  stopRecurringExpense(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/recurringexpenses/${id}/stop`, {});
  }
}
