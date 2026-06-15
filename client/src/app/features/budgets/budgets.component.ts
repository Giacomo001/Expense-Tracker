import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BudgetsService } from './services/budgets.service';
import { AppStateService } from '@core/services/state/app-state.service';
import { ToastService } from '@core/services/toast/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { BudgetCreate, BudgetRead } from './models/budget.model';
import { ConfirmDialogData, DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { TabsComponent } from "@layout/tabs/tabs.component";
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-budgets',
  imports: [TabsComponent, MatIconModule, DecimalPipe],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetsComponent {
  // ============================================================
  // INJECT
  // ============================================================
  private budgetsService = inject(BudgetsService);
  private appStateService = inject(AppStateService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected budgetsList = this.appStateService.budgetsList;
  protected currentMonthLabel = this.appStateService.currentMonthLabel;
  protected categoriesList = this.appStateService.categoriesList;

  //Variables to manage the table-inline create/update state of the budget
  protected editingCategoryId = signal<string | null>(null);
  protected editingAmount = signal<number | null>(null);
  
  // ============================================================
  // COMPUTED
  // ============================================================
  protected categoriesWithBudget = computed(() => {
    const categories = this.categoriesList();
    const budgets = this.budgetsList();
    const expenses = this.appStateService.expensesList();
    const year = this.appStateService.viewYear();
    const month = this.appStateService.viewMonth();

    //Merge frontend between categories and budgets to show which one has a budget
    return categories.map(c => {
      const budget = budgets.find(b => b.categoryId === c.id) ?? null;

      const spent = expenses
        .filter(e => {
          const [y, m] = e.date.toString().split('-').map(Number); //Year and month of the expense in the loop
          return e.categoryId === c.id && y === year && m === month; //Takes every expense that has the same CategoryId AND the same year and month
        })
        .reduce((sum, e) => sum + e.amount, 0); //Sum all the amount of the filtered expenses

        const percentage = budget ? Math.min((spent / budget.amount) * 100, 100) : 0;
        const isOverBudget = budget ? spent > budget.amount : false;

        return { ...c, budget, spent, percentage, isOverBudget };
      });
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
  protected startEditing(categoryId: string, currentAmount: number | null): void {
    this.editingCategoryId.set(categoryId);
    this.editingAmount.set(currentAmount);
  }

  protected cancelEdit(): void {
    this.editingCategoryId.set(null);
    this.editingAmount.set(null);
  }

  protected saveBudget(categoryId: string, existingBudget: BudgetRead | null): void {
    const amount = this.editingAmount();
    if(!amount || amount <= 0) return;

    if(existingBudget) {
      //Update
      this.toastService.loading(
        this.budgetsService.updateBudget(existingBudget.id, { amount }),
        {
          loading: 'Updating budget...',
          success: 'Budget updated!',
          error: err => err?.error?.title ?? 'An error occurred'
        }
      ).subscribe({
        next: updated => {
          this.budgetsList.update(list => 
            //If the element was modified, the new list will have the updated element, otherwise it will have the old element
            list.map(b => b.id === updated.id ? updated : b)
          );

          this.cancelEdit();
        }
      })
    } else {
      //Create
      this.toastService.loading(
        this.budgetsService.createBudget({ amount, categoryId }),
        {
          loading: 'Creating budget...',
          success: 'Budget created!',
          error: err => err?.error?.title ?? 'An error occurred'
        }
      ).subscribe({
        next: created => {
          this.budgetsList.update(list => [...list, created]);
          this.cancelEdit();
        }
      })
    }
  }

  protected deleteBudget(budget: BudgetRead): void {
    const ref = this.dialog.open(DeleteDialogComponent, {
      data: { itemName: budget.categoryName, title: 'Budget'} satisfies ConfirmDialogData
    });

    ref.afterClosed().subscribe(confirmed => {
      if(!confirmed) return;

      this.toastService.loading(
        this.budgetsService.deleteBudget(budget.id),
        {
          loading: 'Deleting budget...',
          success: 'Budget deleted!',
          error: err => err?.error?.title ?? 'An error occurred'
        }
      ).subscribe({
        next: () => {
          //The budget with the same ID as the budget passed as a parameter gets filtered out of the list
          this.budgetsList.update(list => list.filter(b => b.id !== budget.id));
        }
      })
    });
  }
}
