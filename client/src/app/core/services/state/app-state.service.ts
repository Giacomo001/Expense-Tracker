import { computed, Injectable, signal } from '@angular/core';
import { CategoryRead } from '@features/categories/models/category.model';
import { ExpenseRead } from '@features/expenses/models/expense.model';
import { getTodayString } from '@shared/utils/calendar.utils';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  //============================================================
  // SIGNALS
  //============================================================
  //The lists are synced in their components and they are shared throughout the app (SSoT = Single Source of Truth)
  readonly expensesList = signal<ExpenseRead[]>([]);
  readonly categoriesList = signal<CategoryRead[]>([]);

  //Selection Management
  readonly viewYear = signal<number>(new Date().getFullYear());
  readonly viewMonth = signal<number>(new Date().getMonth() + 1);
  readonly selectedDate = signal<string>(getTodayString());
  readonly selectedCategoryId = signal<string | null>(null);

  //============================================================
  // COMPUTED
  //============================================================
  readonly currentMonthLabel = computed(() =>
    new Date(this.viewYear(), this.viewMonth() - 1, 1)
      .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  );
}
