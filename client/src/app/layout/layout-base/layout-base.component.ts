import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CalendarComponent } from "@layout/calendar/calendar.component";
import { ExpenseRead } from '@features/expenses/models/expense.model';
import { AppStateService } from '@core/services/state/app-state.service';
import { RouterOutlet } from '@angular/router';
import { ExpensesService } from '@features/expenses/services/expenses.service';
import { ToastService } from '@core/services/toast/toast.service';
import { CategoryRead } from '@features/categories/models/category.model';
import { CategoriesService } from '@features/categories/services/categories.service';
import { forkJoin } from 'rxjs';
import { CategoriesComponent } from '@features/categories/categories.component';

@Component({
  selector: 'app-layout-base',
  imports: [RouterOutlet, CategoriesComponent, CalendarComponent],
  templateUrl: './layout-base.component.html',
  styleUrl: './layout-base.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutBaseComponent implements OnInit {
  //============================================================
  // INJECT
  //============================================================
  private appStateService = inject(AppStateService);
  private expenseService = inject(ExpensesService);
  private categoryService = inject(CategoriesService);
  private toastService = inject(ToastService);

  //============================================================
  // PROPERTIES
  //============================================================
  protected selectedCategoryId = this.appStateService.selectedCategoryId;

  //============================================================
  // SIGNALS
  //============================================================
  protected expensesList = signal<ExpenseRead[]>([]);
  protected categoriesList = signal<CategoryRead[]>([]);

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
      expenses: this.expenseService.getExpenses(),
      categories: this.categoryService.getCategories()
    });

    request$.subscribe({
      next: ({ expenses, categories }) => {
        //Both lists are populated here, in the parent component
        this.appStateService.expensesList.set(expenses);
        this.appStateService.categoriesList.set(categories);
      },
      error: _ => {
        this.toastService.error("There was an error loading the records.");
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