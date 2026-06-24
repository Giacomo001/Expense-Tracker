import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '@core/services/toast/toast.service';
import { CategoryRead } from '@features/categories/models/category.model';
import { Frequency } from '@features/recurring-expenses/models/frequency.enum';
import { RecurringExpenseCreate, RecurringExpenseRead, RecurringExpenseUpdate } from '@features/recurring-expenses/models/recurring-expense.model';
import { RecurringExpensesService } from '@features/recurring-expenses/services/recurring-expenses.service';

export interface RecurringExpenseDialogData {
  recurringExpense: RecurringExpenseRead | null,
  categories: CategoryRead[]
}

@Component({
  selector: 'app-recurring-expense-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './recurring-expense-dialog.component.html',
  styleUrl: './recurring-expense-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringExpenseDialogComponent implements OnInit {
  // ============================================================
  // INJECT
  // ============================================================
  private recurringExpensesService = inject(RecurringExpensesService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialogRef<RecurringExpenseDialogComponent>);
  private fb = inject(FormBuilder);

  protected data = inject<RecurringExpenseDialogData>(MAT_DIALOG_DATA);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected recurringExpenseForm: FormGroup = new FormGroup({});
  
  // ============================================================
  // COMPUTED
  // ============================================================
  
  // ============================================================
  // PROPERTIES
  // ============================================================
  protected isEditMode = this.data?.recurringExpense !== null;
  protected modeLabel = this.isEditMode ? 'Update' : 'Create';
  protected errorLabel = this.isEditMode ? 'update' : 'creation';
  protected loadingMessage = this.isEditMode ? 'Updating recurring expense...' : 'Creating recurring expense...';
  protected successMessage = this.isEditMode ? 'Recurring expense updated!' : 'Recurring expense created!';

  protected readonly frequencies = Object.values(Frequency).filter(f => f !== Frequency.Manual);
  protected readonly manual = Frequency.Manual; //Exposed but disabled in the HTML file
  
  // ============================================================
  // LIFE CYCLES
  // ============================================================
  ngOnInit(): void {
    this.initializeForm();
  }
  
  // ============================================================
  // METHODS
  // ============================================================
  private initializeForm(): void {
    if (this.isEditMode) {
      //Update — only Amount and Description are editable (RecurringExpenseUpdateDto)
      this.recurringExpenseForm = this.fb.group({
        amount: [
          this.data.recurringExpense?.amount ?? null,
          [Validators.required, Validators.min(0.01)]
        ],
        description: [this.data.recurringExpense?.description ?? ''],
        frequency: [
          this.data.recurringExpense?.frequency ?? Frequency.Monthly,
          Validators.required
        ]
      });
    } else {
      //Create — full form (RecurringExpenseCreateDto)
      this.recurringExpenseForm = this.fb.group({
        amount: [null, [Validators.required, Validators.min(0.01)]],
        description: [''],
        frequency: [Frequency.Monthly, Validators.required],
        categoryId: ['', Validators.required],
        startDate: [
          new Date().toISOString().split('T')[0],
          Validators.required
        ]
      });
    }
  }

  protected save(): void {
    if (this.recurringExpenseForm.invalid) {
      this.toastService.error(`There was a problem with the ${this.errorLabel} of the recurring expense.`);
      return;
    }

    const formValue = this.recurringExpenseForm.value;

    const request$ = this.isEditMode ? 
      this.recurringExpensesService.updateRecurringExpense(
        this.data.recurringExpense!.id,
        { 
          amount: formValue.amount, 
          description: formValue.description,
          frequency: formValue.frequency 
        } as RecurringExpenseUpdate
      ) : 
      this.recurringExpensesService.createRecurringExpense(formValue as RecurringExpenseCreate);

    this.toastService.loading(request$, {
      loading: this.loadingMessage,
      success: this.successMessage,
      error: err => err?.error?.title ?? 'An error occurred'
    }).subscribe({
      next: res => this.dialog.close(res)
    });
  }

  protected cancel(): void {
    this.dialog.close(null);
  }
}
