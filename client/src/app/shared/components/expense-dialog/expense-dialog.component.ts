import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '@core/services/toast/toast.service';
import { CategoryRead } from '@features/categories/models/category.model';
import { ExpenseCreate, ExpenseRead, ExpenseUpdate } from '@features/expenses/models/expense.model';
import { ExpensesService } from '@features/expenses/services/expenses.service';
import { Frequency } from '@features/recurring-expenses/models/frequency.enum';

export interface ExpenseDialogData {
  expense: ExpenseRead | null;
  categories: CategoryRead[];
  selectedDate: string;
}

@Component({
  selector: 'app-expense-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './expense-dialog.component.html',
  styleUrl: './expense-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseDialogComponent implements OnInit {
  // ============================================================
  // INJECT
  // ============================================================
  private expensesService = inject(ExpensesService);
  private toastService = inject(ToastService);
  private dialogRef = inject(MatDialogRef<ExpenseDialogComponent>);
  private fb = inject(FormBuilder);

  //Helps setting the environment for the UPDATE or the CREATE
  protected data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected expenseForm: FormGroup = new FormGroup({}); 

  // ============================================================
  // PROPERTIES 
  // ============================================================
  protected isEditMode = this.data?.expense !== null;
  protected readonly frequencies = Object.values(Frequency); //Object.values(Frequency) => takes all the values in the Enum and creates an array

  //Labels
  protected modeLabel = this.isEditMode ? 'Update' : 'Create';
  protected errorLabel = this.isEditMode ? 'update' : 'creation';
  protected loadingMessage = this.isEditMode ? 'Updating expense...' : 'Creating expense...';
  protected successMessage = this.isEditMode ? 'Expense updated!' : 'Expense created!';
  
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
    this.expenseForm = this.fb.group({
      amount: [
        this.data.expense?.amount ?? null, 
        [Validators.required, Validators.min(0.01)]
      ],
      description: [this.data.expense?.description ?? ''],
      date: [
        this.data.expense?.date ?? this.data.selectedDate,
        Validators.required
      ],
      categoryId: [
        this.data.expense?.categoryId ?? '',
        Validators.required
      ],
      //The 'Frequency' field is only visible in the Create mode
      ...(!this.isEditMode && {
        frequency: [Frequency.Manual, Validators.required]
      })
    });
  }

  protected save() {
    if(this.expenseForm.invalid) {
      this.toastService.error(`There was a problem with the ${this.errorLabel} of the expense.`);
      return;
    }

    const request$ = this.isEditMode ?
      this.expensesService.updateExpense(this.data.expense!.id, this.expenseForm.value as ExpenseUpdate) :
      this.expensesService.createExpense(this.expenseForm.value as ExpenseCreate);

    this.toastService.loading(request$, {
      loading: this.loadingMessage,
      success: this.successMessage,
      error: (err) => err?.error?.title ?? 'An error occurred'
    }).subscribe({
      next: (res) => this.dialogRef.close(res)
    });
  }

  protected cancel() {
    this.dialogRef.close(null);
  }
}
