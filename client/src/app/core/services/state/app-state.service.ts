import { Injectable, signal } from '@angular/core';
import { CategoryRead } from '@features/categories/models/category.model';
import { ExpenseRead } from '@features/expenses/models/expense.model';
import { getTodayString } from '@shared/utils/calendar.utils';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  //The lists are synced in their components and they are shared throughout the app (SSoT = Single Source of Truth)
  readonly expensesList = signal<ExpenseRead[]>([]);
  readonly categoriesList = signal<CategoryRead[]>([]);

  //Date Management
  protected readonly today = new Date();
  protected readonly currentMonth = this.today.getMonth() + 1;
  protected readonly currentYear = this.today.getFullYear();

  readonly viewYear = signal<number>(this.currentYear);
  readonly viewMonth = signal<number>(this.currentMonth);
  readonly selectedDate = signal<string>(getTodayString());
  readonly selectedCategoryId = signal<string | null>(null);
}
