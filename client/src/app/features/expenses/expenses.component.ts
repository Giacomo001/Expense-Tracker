import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { ExpensesService } from './services/expenses.service';
import { ExpenseRead } from './models/expense.model';
import { ToastService } from '@core/services/toast/toast.service';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, DecimalPipe, KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { getDaysInMonth, getTodayString } from '@shared/utils/calendar.utils';
import { CategoriesComponent } from '@features/categories/categories/categories.component';
import { CalendarComponent } from '@layout/calendar/calendar.component';
import { MatDialog } from '@angular/material/dialog';
import { ExpenseDialogComponent, ExpenseDialogData } from '@shared/components/expense-dialog/expense-dialog.component';
import { ConfirmDialogData, DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { AppStateService } from '@core/services/state/app-state.service';

@Component({
  selector: 'app-expenses',
  imports: [MatIconModule, DatePipe, DecimalPipe, CategoriesComponent, CalendarComponent, NgTemplateOutlet, KeyValuePipe],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent implements OnInit {
  //============================================================
  // INJECT
  //============================================================
  private expenseService = inject(ExpensesService);
  private appStateService = inject(AppStateService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);

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

    if (categoryId) {
      //Category mode — show all expenses for that category grouped by month
      return this.expensesList()
        .filter(e => e.categoryId === categoryId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    //Date mode — show expenses for the selected date
    return this.expensesList().filter(e => {
      const expenseDate = e.date.toString().split('T')[0];
      return expenseDate === date;
    });
  });

  protected monthExpenses = computed(() => {
    return this.expensesList().filter(e => {
        const [y, m] = e.date.toString().split('-').map(Number);

        return y === this.viewYear() && m === this.viewMonth();
      })
  });

  protected grandTotal = computed(() =>
    this.monthExpenses().reduce((sum, e) => sum + e.amount, 0)
  );

  protected dailyAverage = computed(() => {
    const daysInMonth = getDaysInMonth(this.viewYear(), this.viewMonth());

    return this.grandTotal() / daysInMonth;
  });

  protected isCategoryMode = computed(() => this.selectedCategoryId() !== null);

  protected expensesGroupedByMonth = computed(() => {
    if (!this.isCategoryMode()) return new Map<string, ExpenseRead[]>();

    const groups = new Map<string, ExpenseRead[]>();

    for (const expense of this.filteredExpenses()) {
      const [year, month] = expense.date.toString().split('-').map(Number);
      const key = new Date(year, month - 1, 1)
        .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(expense);
    }

    return groups;
  });

  // ============================================================
  // PROPERTIES
  // ============================================================
  protected title = "expense";

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
      next: (expenses) => {
        this.expensesList.set(expenses);
        this.appStateService.expensesList.set(expenses);
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

  protected onDateSelected(date: string) {
    this.selectedDate.set(date);
    this.selectedCategoryId.set(null); //Resets category filter when a date is selected
  }

  //DIALOG
  protected openCreateDialog() {
    const ref = this.dialog.open(ExpenseDialogComponent, {
      data: {
        expense: null,
        categories: this.appStateService.categoriesList(),
        selectedDate: this.selectedDate()
      } satisfies ExpenseDialogData
    });

    ref.afterClosed().subscribe(result => {
      if(result) {
        this.expensesList.update(list => [...list, result]);
        this.appStateService.expensesList.set(this.expensesList());
      }
    });
  }

  protected openEditDialog(expense: ExpenseRead) {
    const ref = this.dialog.open(ExpenseDialogComponent, {
      data: {
        expense,
        categories: this.appStateService.categoriesList(),
        selectedDate: this.selectedDate()
      } satisfies ExpenseDialogData
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.expensesList.update(list =>
          //Updates only the one with the same Id as the one passed as a parameter
          list.map(e => e.id === result.id ? result : e)
        );

        this.appStateService.expensesList.set(this.expensesList());
      }
    });
  }

  protected deleteExpense(expenseId: string, name: string, title: string) {
    const ref = this.dialog.open(DeleteDialogComponent, {
      data: { itemName: name, title } satisfies ConfirmDialogData
    });

    ref.afterClosed().subscribe(confirmed => {
      if(!confirmed) return;

      this.toastService.loading(
        this.expenseService.deleteExpense(expenseId),
        {
          loading: "Deleting expense...",
          success: "Expense deleted!",
          error: err => err?.error?.title ?? 'An error occurred'
        }
      ).subscribe({
        next: () => {
          this.expensesList.update(list => list.filter(c => expenseId != c.id));
          this.appStateService.expensesList.set(this.expensesList());
        }
      });
    });
  }
}