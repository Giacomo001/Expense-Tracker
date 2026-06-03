import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { ExpensesService } from './services/expenses.service';
import { ExpenseRead } from './models/expense.model';
import { ToastService } from '@core/services/toast/toast.service';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, DecimalPipe } from '@angular/common';
import { getDaysInMonth, getTodayString } from '@shared/utils/calendar.utils';
import { CategoriesComponent } from '@features/categories/categories/categories.component';
import { CalendarComponent } from '@layout/calendar/calendar.component';

@Component({
  selector: 'app-expenses',
  imports: [MatIconModule, DatePipe, DecimalPipe, CategoriesComponent, CalendarComponent],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent implements OnInit {
  //============================================================
  // INJECT
  //============================================================
  private expenseService = inject(ExpensesService);
  private toastService = inject(ToastService);

  //============================================================
  // PROPERTIES
  //============================================================
  protected readonly today = new Date();
  protected readonly currentMonth = this.today.getMonth() + 1;
  protected readonly currentYear = this.today.getFullYear();

  //============================================================
  // SIGNALS
  //============================================================
  protected expensesList = signal<ExpenseRead[]>([]);
  protected isSkeletonLoading = signal<boolean>(true);
  protected selectedCategoryId = signal<string | null>(null);
  protected selectedDate = signal<string>(getTodayString());

  //Variables to manage the expenses monthly info
  protected viewYear = signal(this.currentYear);
  protected viewMonth = signal(this.currentMonth);

  //============================================================
  // COMPUTED
  //============================================================
  protected currentMonthLabel = computed(() =>
    new Date(this.viewYear(), this.viewMonth() - 1, 1)
      .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  );

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

  protected grandTotal = computed(() =>
    this.expensesList()
    .filter(e => {
      const [y, m] = e.date.toString().split('-').map(Number);

      return y === this.viewYear() && m === this.viewMonth();
    })
    .reduce((sum, e) => sum + e.amount, 0)
  );

  protected dailyAverage = computed(() => {
    const daysInMonth = getDaysInMonth(this.viewYear(), this.viewMonth());

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
    this.expenseService.getExpenses().subscribe({
      next: expenses => {
        this.expensesList.set(expenses);
        this.isSkeletonLoading.set(false);
      },
      error: () => {
        this.toastService.error("There was an error loading the records.");
        this.isSkeletonLoading.set(false);
      }
    });
  }

  protected onMonthChanged(event: { year: number; month: number }) {
    this.viewYear.set(event.year);
    this.viewMonth.set(event.month);
  }
}