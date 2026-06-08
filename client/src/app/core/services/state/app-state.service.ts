import { Injectable, signal } from '@angular/core';
import { CategoryRead } from '@features/categories/models/category.model';
import { ExpenseRead } from '@features/expenses/models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  //The lists are synced in their components and they are shared throughout the app (SSoT = Single Source of Truth)
  readonly expensesList = signal<ExpenseRead[]>([]);
  readonly categoriesList = signal<CategoryRead[]>([]);
}
