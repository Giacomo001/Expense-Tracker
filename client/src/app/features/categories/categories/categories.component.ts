import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { SumPipe } from '@shared/pipes/sum.pipe';
import { CategoriesService } from '../services/categories.service';
import { ToastService } from '@core/services/toast/toast.service';
import { CategoryRead } from '../models/category.model';
import { ExpenseRead } from '@features/expenses/models/expense.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-categories',
  imports: [MatIconModule, DecimalPipe, SumPipe],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent implements OnInit {
  // ============================================================
  // INJECT
  // ============================================================
  private categoriesService = inject(CategoriesService);
  private toastService = inject(ToastService);

  // ============================================================
  // INPUTS & OUTPUTS
  // ============================================================
  expensesList = input<ExpenseRead[]>([]);
  categorySelected = output<string | null>(); //Emits to parent
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected categoriesList = signal<CategoryRead[]>([]);
  protected selectedCategoryId = signal<string | null>(null);
  protected isLoading = signal<boolean>(true);
  
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
    this.categoriesService.getCategories().subscribe({
      next: (categories) => {
        this.categoriesList.set(categories);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('There was an error loading the categories.');
        this.isLoading.set(false);
      }
    });
  }

  //Method to emit the value of the chosen category
  protected selectCategory(id: string | null) {
    this.selectedCategoryId.set(id);
    this.categorySelected.emit(id);
  }
}
