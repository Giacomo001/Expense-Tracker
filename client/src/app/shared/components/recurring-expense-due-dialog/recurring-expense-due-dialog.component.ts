import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AppStateService } from '@core/services/state/app-state.service';
import { ToastService } from '@core/services/toast/toast.service';
import { ExpenseRead } from '@features/expenses/models/expense.model';
import { RecurringExpenseDue } from '@features/recurring-expenses/models/recurring-expense.model';
import { RecurringExpensesService } from '@features/recurring-expenses/services/recurring-expenses.service';

export interface RecurringExpenseDueDialogData {
  dueExpenses: RecurringExpenseDue[];
}

@Component({
  selector: 'app-recurring-expense-due-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule, DecimalPipe],
  templateUrl: './recurring-expense-due-dialog.component.html',
  styleUrl: './recurring-expense-due-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringExpenseDueDialogComponent implements OnInit {
  // ============================================================
  // INJECT
  // ============================================================
  private appStateService = inject(AppStateService);
  private recurringExpensesService = inject(RecurringExpensesService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialogRef<RecurringExpenseDueDialogComponent>)
  private fb = inject(FormBuilder);

  protected data = inject<RecurringExpenseDueDialogData>(MAT_DIALOG_DATA);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected currentIndex = signal<number>(0); //Useful if 2 or more expenses are due for that day
  protected showUpdateTemplateStep = signal<boolean>(false);

  protected confirmForm: FormGroup = new FormGroup({});
  
  // ============================================================
  // COMPUTED
  // ============================================================
  
  // ============================================================
  // PROPERTIES
  // ============================================================
  protected get currentExpense(): RecurringExpenseDue {
    return this.data.dueExpenses[this.currentIndex()];
  }

  protected get isLast(): boolean {
    return this.currentIndex() === this.data.dueExpenses.length - 1;
  }

  protected get totalCount(): number {
    return this.data.dueExpenses.length;
  }
  
  // ============================================================
  // LIFE CYCLES
  // ============================================================
  ngOnInit(): void {
    this.initializeForm();
  }
  
  // ============================================================
  // METHODS
  // ============================================================
  private initializeForm() {
    this.confirmForm = this.fb.group({
      amount: [
        this.currentExpense.amount,
        [Validators.required, Validators.min(0.01)]
      ],
      description: [this.currentExpense.description ?? '']
    });
  }

  private resetFormForCurrent(): void {
    this.confirmForm.patchValue({
      amount: this.currentExpense.amount,
      description: this.currentExpense.description ?? ''
    });
    this.showUpdateTemplateStep.set(false);
  }

  protected confirm(): void {
    //STEP 1 - Amount and Description can be changed
    const amountChanged = this.confirmForm.value.amount !== this.currentExpense.amount;
    const descriptionChanged = this.confirmForm.value.description !== (this.currentExpense.description ?? '');

    //STEP 2 - Gets to it only if one of the fields was modified. It asks to confirm the update
    if ((amountChanged || descriptionChanged) && !this.showUpdateTemplateStep()) {
      this.showUpdateTemplateStep.set(true);
      return;
    }

    this.executeConfirm(false);
  }

  //A template is present
  protected confirmWithTemplateUpdate(updateTemplate: boolean): void {
    this.executeConfirm(updateTemplate);
  }

  private executeConfirm(updateTemplate: boolean): void {
    this.toastService.loading(
      this.recurringExpensesService.confirmRecurringExpense(this.currentExpense.id, {
        amount: this.confirmForm.value.amount,
        description: this.confirmForm.value.description,
        updateTemplate
      }),
      {
        loading: 'Confirming expense...',
        success: 'Expense confirmed!',
        error: err => err?.error?.title ?? 'An error occurred'
      }
    ).subscribe({
      next: (expense: ExpenseRead) => {
        this.appStateService.expensesList.update(list => [...list, expense]);

        //The Due Expense is removed so the dialog is not triggered again
        this.appStateService.dueRecurringExpensesList.update(list =>
          list.filter(d => d.id !== this.currentExpense.id)
        );

        //Get the specific RecurringExpense updated so the 'NextDueDate' will also show the next occurrence
        this.recurringExpensesService.getRecurringExpenseById(this.currentExpense.id).subscribe({
          next: updated => {
            this.appStateService.recurringExpensesList.update(list =>
              list.map(r => r.id === updated.id ? updated : r)
            );
          }
        });

        this.nextOrClose();
      }
    });
  }

  protected skip(): void {
    this.toastService.loading(
      this.recurringExpensesService.skipRecurringExpense(this.currentExpense.id),
      {
        loading: 'Skipping...',
        success: 'Skipped!',
        error: err => err?.error?.title ?? 'An error occurred'
      }
    ).subscribe({
      next: () => {
        this.appStateService.dueRecurringExpensesList.update(list =>
          list.filter(d => d.id !== this.currentExpense.id)
        );
        this.nextOrClose();
      }
    });
  }

  protected stop(): void {
    this.toastService.loading(
      this.recurringExpensesService.stopRecurringExpense(this.currentExpense.id),
      {
        loading: 'Stopping recurring expense...',
        success: 'Recurring expense stopped!',
        error: err => err?.error?.title ?? 'An error occurred'
      }
    ).subscribe({
      next: () => {
        this.appStateService.dueRecurringExpensesList.update(list =>
          list.filter(d => d.id !== this.currentExpense.id)
        );
        this.appStateService.recurringExpensesList.update(list =>
          list.map(r => r.id === this.currentExpense.id
            ? { ...r, frequency: 'Manual' as any, nextDueDate: undefined }
            : r
          )
        );
        this.nextOrClose();
      }
    });
  }

  private nextOrClose(): void {
    if (this.isLast) {
      this.dialog.close();
    } else {
      this.currentIndex.update(i => i + 1);
      this.resetFormForCurrent();
    }
  }
}
