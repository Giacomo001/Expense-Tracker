import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AppStateService } from '@core/services/state/app-state.service';
import { RecurringExpensesService } from './services/recurring-expenses.service';
import { ToastService } from '@core/services/toast/toast.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RecurringExpenseRead } from './models/recurring-expense.model';
import { TabsComponent } from '@layout/tabs/tabs.component';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ConfirmDialogData, DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { DaysUntilPipe } from '@shared/pipes/days-until/days-until.pipe';
import { RecurringExpenseDialogComponent, RecurringExpenseDialogData } from '@shared/components/recurring-expense-dialog/recurring-expense-dialog.component';

@Component({
  selector: 'app-recurring-expenses',
  imports: [TabsComponent, MatDialogModule, MatIconModule, DecimalPipe, DatePipe, DaysUntilPipe],
  templateUrl: './recurring-expenses.component.html',
  styleUrl: './recurring-expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringExpensesComponent {
  // ============================================================
  // INJECT
  // ============================================================
  private appStateService = inject(AppStateService);
  private recurringExpensesService = inject(RecurringExpensesService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected recExpensesList = this.appStateService.recurringExpensesList;
  protected currentMonthLabel = this.appStateService.currentMonthLabel;
  protected selectedCategoryId = this.appStateService.selectedCategoryId;
  
  // ============================================================
  // COMPUTED
  // ============================================================
  protected recurringExpensesSorted = computed(() => {
    const categoryId = this.selectedCategoryId();

    console.log(categoryId);

    //Ordering the lists from the closest to the current date to the furthest from it
    return [...this.recExpensesList()]
    .filter(r => categoryId ? r.categoryId === categoryId : true) //Category filter
    .sort((a, b) => {
      if (!a.nextDueDate) return 1;
      if (!b.nextDueDate) return -1;
      return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
    })
  });

  // ============================================================
  // PROPERTIES
  // ============================================================
  
  // ============================================================
  // LIFE CYCLES
  // ============================================================
  
  // ============================================================
  // METHODS
  // ============================================================
  protected openCreateDialog(): void {
    const ref = this.dialog.open(RecurringExpenseDialogComponent, {
      data: {
        recurringExpense: null,
        categories: this.appStateService.categoriesList()
      } satisfies RecurringExpenseDialogData
    });

    ref.afterClosed().subscribe(result => {
      if(result) {
        this.recExpensesList.update(list => [...list, result]);
      }
    });
  }

  protected openEditDialog(recurringExpense: RecurringExpenseRead): void {
    const ref = this.dialog.open(RecurringExpenseDialogComponent, {
      data: {
        recurringExpense,
        categories: this.appStateService.categoriesList()
      } satisfies RecurringExpenseDialogData
    });

    ref.afterClosed().subscribe(result => {
      if(result) {
        this.recExpensesList.update(list => 
          list.map(r => r.id === result.id ? result : r)
        )
      }
    });
  }

  protected deleteRecurringExpense(recurringExpense: RecurringExpenseRead) {
    const ref = this.dialog.open(DeleteDialogComponent, {
      data: {
        itemName: recurringExpense.description ?? recurringExpense.categoryName, 
        title: "recurring expense" 
      } satisfies ConfirmDialogData
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.toastService.loading(
        this.recurringExpensesService.deleteRecurringExpense(recurringExpense.id),
        {
          loading: 'Deleting recurring expense...',
          success: 'Recurring expense deleted!',
          error: err => err?.error?.title ?? 'An error occurred'
        }
      ).subscribe({
        next: () => {
          this.recExpensesList.update(list => list.filter(r => r.id !== recurringExpense.id));
        }
      });
    });
  }
}
