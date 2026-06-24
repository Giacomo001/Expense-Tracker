import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CalendarComponent } from "@layout/calendar/calendar.component";
import { AppStateService } from '@core/services/state/app-state.service';
import { RouterOutlet } from '@angular/router';
import { ExpensesService } from '@features/expenses/services/expenses.service';
import { ToastService } from '@core/services/toast/toast.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { catchError, forkJoin, of } from 'rxjs';
import { CategoriesComponent } from '@features/categories/categories.component';
import { BudgetsService } from '@features/budgets/services/budgets.service';
import { RecurringExpensesService } from '@features/recurring-expenses/services/recurring-expenses.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RecurringExpenseDueDialogComponent } from '@shared/components/recurring-expense-due-dialog/recurring-expense-due-dialog.component';

@Component({
  selector: 'app-layout-base',
  imports: [RouterOutlet, MatDialogModule, CategoriesComponent, CalendarComponent],
  templateUrl: './layout-base.component.html',
  styleUrl: './layout-base.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutBaseComponent implements OnInit {
  //============================================================
  // INJECT
  //============================================================
  private appStateService = inject(AppStateService);
  private budgetsService = inject(BudgetsService);
  private categoriesService = inject(CategoriesService);
  private expensesService = inject(ExpensesService);
  private recurringExpensesService = inject(RecurringExpensesService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);

  //============================================================
  // PROPERTIES
  //============================================================
  protected selectedCategoryId = this.appStateService.selectedCategoryId;

  //============================================================
  // SIGNALS
  //============================================================

  //============================================================
  // COMPUTED
  //============================================================

  //============================================================
  // LIFE CYCLES
  //============================================================
  ngOnInit(): void {
    this.loadRecords();
  }

  //============================================================
  // METHODS
  //============================================================
  private loadRecords() {
    const request$ = forkJoin({
      budgets: this.budgetsService.getBudgetsByUserId(),
      categories: this.categoriesService.getCategories(),
      expenses: this.expensesService.getExpenses(),
      recurringExpenses: this.recurringExpensesService.getAllRecurringExpensesByUserId()
    });

    request$.subscribe({
      next: ({ budgets, categories, expenses, recurringExpenses }) => {
        //All lists are populated here since it's the parent component
        this.appStateService.budgetsList.set(budgets);
        this.appStateService.categoriesList.set(categories);
        this.appStateService.expensesList.set(expenses);
        this.appStateService.recurringExpensesList.set(recurringExpenses);
      },
      error: _ => {
        this.toastService.error("There was an error loading the records.");
      }
    });

    //Due Recurring Expenses are outside the 'ForkJoin' because they need to trigger the create Expense dialog
    this.recurringExpensesService.getDueRecurringExpensesByUserId().pipe(
      catchError(() => {
        this.toastService.error("There was an error loading the due recurring expenses.");
        return of([]);
      })
    ).subscribe({
      next: exps => {
        this.appStateService.dueRecurringExpensesList.set(exps);

        if (exps && exps.length > 0) {
          this.dialog.open(RecurringExpenseDueDialogComponent, {
            data: { dueExpenses: exps },
            disableClose: true,
            minWidth: '34rem'
          });
        }
      }
    });
  }

  protected onDateSelected(date: string) {
    this.appStateService.selectedDate.set(date);
    this.appStateService.selectedCategoryId.set(null); //Resets category filter when a date is selected
  }

  protected onMonthChanged(event: { year: number; month: number }) {
    //It sets the year and the month in the AppState
    this.appStateService.viewYear.set(event.year);
    this.appStateService.viewMonth.set(event.month);
  }
}