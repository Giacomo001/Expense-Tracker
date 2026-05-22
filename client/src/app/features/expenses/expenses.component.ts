import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ExpensesService } from './services/expenses.service';
import { LoadingService } from '@core/services/loading/loading.service';
import { ExpenseRead } from './models/expense.model';
import { ToastService } from '@core/services/toast/toast.service';

@Component({
  selector: 'app-expenses',
  imports: [],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent implements OnInit {  
  // ============================================================
  // INJECT
  // ============================================================
  private expenseService = inject(ExpensesService);
  private toast = inject(ToastService);
  private loading = inject(LoadingService);
  private dialog = inject(MatDialog);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected expensesList = signal<ExpenseRead[]>([]);
  protected isSkeletonLoading = signal<boolean>(true);
  
  // ============================================================
  // LIFE CYCLES
  // ============================================================
  ngOnInit(): void {
    this.loadRecords();
  }
  
  // ============================================================
  // METHODS
  // ============================================================
  private loadRecords() {
    this.expenseService.getExpenses().subscribe({
      next: exps => {
        this.expensesList.set(exps);
        this.isSkeletonLoading.set(false);
      },
      error: () => {
        this.toast.error("There was an error during the load of the expenses");
        this.isSkeletonLoading.set(false);
      }
    })
  }
}
