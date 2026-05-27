import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ExpensesService } from './services/expenses.service';
import { ExpenseRead } from './models/expense.model';
import { ToastService } from '@core/services/toast/toast.service';
import { MatIconModule } from '@angular/material/icon';
import { CategoryRead } from '@features/categories/models/category.model';
import { forkJoin, shareReplay } from 'rxjs';
import { CategoriesService } from '@features/categories/services/categories.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { SumPipe } from '@shared/pipes/sum.pipe';
import { buildCalendarDays, getDaysInMonth, getFirstDayOfMonth, getMonthLabel, getNextMonth, getPreviousMonth, getTodayString, toDateString } from '@shared/utils/calendar.utils';

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

  //============================================================
  // SIGNALS
  //============================================================
  protected expensesList = signal<ExpenseRead[]>([]);
  protected categoriesList = signal<CategoryRead[]>([]);
  protected isSkeletonLoading = signal<boolean>(true);
  protected selectedCategoryId = signal<string | null>(null);
  protected selectedDate = signal<string>(getTodayString());

  //Navigable calendar — starts at current month
  protected viewYear = signal(this.currentYear);
  protected viewMonth = signal(this.currentMonth);

  //============================================================
  // COMPUTED
  //============================================================
  protected viewMonthLabel = computed(() =>
    getMonthLabel(this.viewYear(), this.viewMonth())
  );

  protected viewCalendarDays = computed(() =>
    buildCalendarDays(this.viewYear(), this.viewMonth()).map(day => ({
      ...day,
      hasExpense: this.expensesList().some(e =>
        e.date.toString().split('T')[0] === toDateString(this.viewYear(), this.viewMonth(), day.date)
      )
    }))
  );

  protected viewEmptyCells = computed(() =>
    Array.from({ length: getFirstDayOfMonth(this.viewYear(), this.viewMonth()) }, (_, i) => i)
  );

  //Month above — previous
  protected prevMonthData = computed(() => getPreviousMonth(this.viewYear(), this.viewMonth()));
  protected prevMonthLabel = computed(() => getMonthLabel(this.prevMonthData().year, this.prevMonthData().month));
  protected prevMonthCalendarDays = computed(() =>
    buildCalendarDays(this.prevMonthData().year, this.prevMonthData().month).map(day => ({
      ...day,
      hasExpense: this.expensesList().some(e =>
        e.date.toString().split('T')[0] === toDateString(this.prevMonthData().year, this.prevMonthData().month, day.date)
      )
    }))
  );
  protected prevMonthEmptyCells = computed(() =>
    Array.from({ length: getFirstDayOfMonth(this.prevMonthData().year, this.prevMonthData().month) }, (_, i) => i)
  );
  protected prevMonthTotal = computed(() =>
    this.expensesList()
      .filter(e => {
        const [y, m] = e.date.toString().split('-').map(Number);
        return y === this.prevMonthData().year && m === this.prevMonthData().month;
      })
      .reduce((sum, e) => sum + e.amount, 0)
  );

  //Month below — next
  protected nextMonthData = computed(() => getNextMonth(this.viewYear(), this.viewMonth()));
  protected nextMonthLabel = computed(() => getMonthLabel(this.nextMonthData().year, this.nextMonthData().month));
  protected nextMonthCalendarDays = computed(() =>
    buildCalendarDays(this.nextMonthData().year, this.nextMonthData().month).map(day => ({
      ...day,
      hasExpense: this.expensesList().some(e =>
        e.date.toString().split('T')[0] === toDateString(this.nextMonthData().year, this.nextMonthData().month, day.date)
      )
    }))
  );
  protected nextMonthEmptyCells = computed(() =>
    Array.from({ length: getFirstDayOfMonth(this.nextMonthData().year, this.nextMonthData().month) }, (_, i) => i)
  );
  protected nextMonthTotal = computed(() =>
    this.expensesList()
      .filter(e => {
        const [y, m] = e.date.toString().split('-').map(Number);
        return y === this.nextMonthData().year && m === this.nextMonthData().month;
      })
      .reduce((sum, e) => sum + e.amount, 0)
  );

  //Expenses filtered by selected date and category
  protected filteredExpenses = computed(() => {
    const date = this.selectedDate();
    const categoryId = this.selectedCategoryId();
    return this.expensesList().filter(e => {
      const expenseDate = e.date.toString().split('T')[0];
      const datesMatch = expenseDate === date;
      const categoryMatches = !categoryId || e.categoryId === categoryId;
      return datesMatch && categoryMatches;
    });
  });

  //Total of all expenses in current month
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
        this.isSkeletonLoading.set(false);
      },
      error: () => {
        this.toastService.error("There was an error loading the records.");
        this.isSkeletonLoading.set(false);
      }
    });
  }

  protected onDayClick(day: number, year: number, month: number) {
    this.selectedDate.set(toDateString(year, month, day));
    //If clicking prev/next month, navigate the calendar to that month
    if (year !== this.viewYear() || month !== this.viewMonth()) {
      this.viewYear.set(year);
      this.viewMonth.set(month);
    }
  }

  protected isSelectedDay(day: number, year: number, month: number): boolean {
    return this.selectedDate() === toDateString(year, month, day);
  }

  protected goToPrevMonth() {
    const prev = getPreviousMonth(this.viewYear(), this.viewMonth());
    this.viewYear.set(prev.year);
    this.viewMonth.set(prev.month);
  }

  protected goToNextMonth() {
    const next = getNextMonth(this.viewYear(), this.viewMonth());
    this.viewYear.set(next.year);
    this.viewMonth.set(next.month);
  }

  //It gets the color of the category
  protected getCategoryColor(categoryId: string): string {
    return this.categoriesList().find(c => c.id === categoryId)?.color ?? '#94A3B8';
  }
}