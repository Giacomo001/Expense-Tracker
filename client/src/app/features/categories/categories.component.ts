import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ToastService } from '@core/services/toast/toast.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CategoryDialogComponent } from '@shared/components/category-dialog/category-dialog.component';
import { ConfirmDialogData, DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { AppStateService } from '@core/services/state/app-state.service';
import { CategoriesService } from './services/categories.service';
import { CategoryRead } from './models/category.model';

@Component({
  selector: 'app-categories',
  imports: [MatIconModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  //============================================================
  // INJECT
  //============================================================
  private categoriesService = inject(CategoriesService);
  private appStateService = inject(AppStateService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);

  //============================================================
  // INPUTS & OUTPUTS
  //============================================================
  expensesList = this.appStateService.expensesList;
  categorySelected = output<string | null>(); //Emits to parent
  
  //============================================================
  // SIGNALS
  //============================================================
  protected categoriesList = this.appStateService.categoriesList;
  protected selectedCategoryId = this.appStateService.selectedCategoryId;
  protected isLoading = signal<boolean>(true);

  //============================================================
  // PROPERTIES
  //============================================================
  protected title = "category";
  
  //============================================================
  // LIFE CYCLES
  //============================================================
  
  //============================================================
  // METHODS
  //============================================================
  //Method to emit the value of the chosen category
  protected selectCategory(id: string | null) {
    this.selectedCategoryId.set(id);
    this.categorySelected.emit(id);
  }

  //Dialog Methods
  protected openCreateDialog() {
    const ref = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
      data: null //It is the CREATE method
    });

    ref.afterClosed().subscribe(result => {
      //Update the page with the new category created
      if(result) {
        this.categoriesList.update(list => [...list, result]);
      }      
    });
  }

  protected openEditDialog(category: CategoryRead) {
    const ref = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
      data: category //Populated == edit mode
    });

    ref.afterClosed().subscribe(result => {
      if(result) {
        this.categoriesList.update(list => list.map(c => c.id === result.id ? result : c));
      }
    });
  }

  protected deleteCategory(categoryId: string, name: string, title: string) {
    //It gets the delete dialog answer
    const ref = this.dialog.open(DeleteDialogComponent, {
      data: { itemName: name, title: title } satisfies ConfirmDialogData //It verifies that the type is the correct one
    });

    ref.afterClosed().subscribe(confirmed => {
      if(!confirmed) return;

      this.toastService.loading(
        this.categoriesService.deleteCategory(categoryId),
        {
          loading: "Deleting category...",
          success: "Category deleted!",
          error: err => err?.error?.title ?? 'An error occurred'
        }
      ).subscribe({
        next: _ => {
          this.categoriesList.update(list => list.filter(c => categoryId != c.id));
        }
      });
    });
  }
}
