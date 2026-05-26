import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ExpensesService } from './services/expenses.service';
import { LoadingService } from '@core/services/loading/loading.service';
import { ExpenseRead } from './models/expense.model';
import { ToastService } from '@core/services/toast/toast.service';
import { MatIconModule } from '@angular/material/icon';
import { CategoryRead } from '@features/categories/models/category.model';
import { forkJoin, shareReplay } from 'rxjs';
import { CategoriesService } from '@features/categories/services/categories.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { SumPipe } from '@shared/pipes/sum.pipe';
import { buildCalendarDays, getDaysInMonth, getTodayString, toDateString } from '@shared/utils/calendar.utils';

@Component({
  selector: 'app-expenses',
  imports: [MatIconModule, DatePipe, DecimalPipe, SumPipe],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent implements OnInit {

  //============================================================
  // INJECT
  //============================================================
  private expenseService = inject(ExpensesService);
  private categoryService = inject(CategoriesService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);

  //============================================================
  // PROPERTIES
  //============================================================
  protected readonly today = new Date();
  protected readonly currentMonth = this.today.getMonth() + 1;
  protected readonly currentYear = this.today.getFullYear();
  protected readonly currentMonthLabel = this.today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  protected readonly calendarEmptyCells = Array.from({
    length: (() => {
      const day = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
      return day === 0 ? 6 : day - 1;
    })()
  }, (_, i) => i);

  //============================================================
  // SIGNALS
  //============================================================
  protected expensesList = signal<ExpenseRead[]>([]);
  protected categoriesList = signal<CategoryRead[]>([]);
  protected isSkeletonLoading = signal<boolean>(true);
  protected selectedCategoryId = signal<string | null>(null);

  protected selectedDate = signal<string>(getTodayString());

  protected calendarDays = signal(
    buildCalendarDays(this.currentYear, this.currentMonth)
  );

  //============================================================
  // COMPUTED
  //============================================================

  //Expenses filtered by selected date and category
  protected filteredExpenses = computed(() => {
    const date = this.selectedDate();
    const categoryId = this.selectedCategoryId();

    console.log('selectedDate:', date);
    console.log('expense dates:', this.expensesList().map(e => e.date.toString().split('T')[0]));

    return this.expensesList().filter(e => {
      const expenseDate = e.date.toString().split('T')[0];
      const datesMatch = expenseDate === date;
      const categoryMatches = !categoryId || e.categoryId === categoryId;
      return datesMatch && categoryMatches;
    });
  });

  protected grandTotal = computed(() =>
    this.expensesList().reduce((sum, e) => sum + e.amount, 0)
  );

  protected dailyAverage = computed(() => {
    const daysInMonth = getDaysInMonth(this.currentYear, this.currentMonth);
    return this.grandTotal() / daysInMonth;
  });

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
    forkJoin({
      expenses: this.expenseService.getExpenses().pipe(shareReplay(1)),
      categories: this.categoryService.getCategories().pipe(shareReplay(1))
    }).subscribe({
      next: ({ expenses, categories }) => {
        this.expensesList.set(expenses);
        this.categoriesList.set(categories);
        this.updateCalendar(expenses);
        this.isSkeletonLoading.set(false);
      },
      error: () => {
        this.toastService.error("There was an error loading the records.");
        this.isSkeletonLoading.set(false);
      }
    });
  }

  //Updates calendar dots based on expenses
  private updateCalendar(expenses: ExpenseRead[]) {
    this.calendarDays.update(days => days.map(day => ({
      ...day,
      hasExpense: expenses.some(e =>
        e.date.toString().split('T')[0] === toDateString(this.currentYear, this.currentMonth, day.date)
      )
    })));
  }

  //Called when a day is clicked on the calendar
  protected onDayClick(day: number) {
    const date = toDateString(this.currentYear, this.currentMonth, day);
    console.log('selectedDate set to:', date);
    this.selectedDate.set(date);
  }

  //Returns true if the given day is the currently selected date
  protected isSelectedDay(day: number): boolean {
    return this.selectedDate() === toDateString(this.currentYear, this.currentMonth, day);
  }
}