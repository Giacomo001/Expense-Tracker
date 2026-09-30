import { computed, Injectable, signal } from '@angular/core';
import { BudgetRead } from '@features/budgets/models/budget.model';
import { CategoryRead } from '@features/categories/models/category.model';
import { ExpenseRead } from '@features/expenses/models/expense.model';
import { RecurringExpenseDue, RecurringExpenseRead } from '@features/recurring-expenses/models/recurring-expense.model';
import { getTodayString } from '@shared/utils/calendar.utils';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  //============================================================
  // SIGNALS
  //============================================================
  //The lists are synced in their components and they are shared throughout the app (SSoT = Single Source of Truth)
  readonly budgetsList = signal<BudgetRead[]>([]);
  readonly categoriesList = signal<CategoryRead[]>([]);
  readonly dueRecurringExpensesList = signal<RecurringExpenseDue[]>([]);
  readonly expensesList = signal<ExpenseRead[]>([]);
  readonly recurringExpensesList = signal<RecurringExpenseRead[]>([]);

  //Selection Management
  readonly selectedCategoryId = signal<string | null>(null);
  readonly selectedDate = signal<string>(getTodayString());
  readonly viewMonth = signal<number>(new Date().getMonth() + 1);
  readonly viewYear = signal<number>(new Date().getFullYear());

  //============================================================
  // COMPUTED
  //============================================================
  readonly currentMonthLabel = computed(() =>
    new Date(this.viewYear(), this.viewMonth() - 1, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );
}
