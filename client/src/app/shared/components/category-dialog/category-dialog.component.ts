import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast/toast.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { CategoryCreate, CategoryRead, CategoryUpdate } from '@features/categories/models/category.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-category-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './category-dialog.component.html',
  styleUrl: './category-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDialogComponent implements OnInit {
  // ============================================================
  // INJECT
  // ============================================================
  private categoriesService = inject(CategoriesService);
  private toastService = inject(ToastService);
  private dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  private fb = inject(FormBuilder);

  //If 'data' is NULL, it is a CREATE otherwise it is an UPDATE
  protected data = inject<CategoryRead | null>(MAT_DIALOG_DATA);

  // ============================================================
  // SIGNALS
  // ============================================================
  protected categoryForm: FormGroup = new FormGroup({});

  // ============================================================
  // PROPERTIES
  // ============================================================
  protected isEditMode: boolean = this.data !== null;

  protected modeLabel = this.isEditMode ? 'Update' : 'Create';
  protected errorLabel = this.isEditMode ? 'update' : 'creation';
  protected loadingMessage = this.isEditMode ? 'Updating category...' : 'Creating category...';
  protected successMessage = this.isEditMode ? 'Category updated!' : 'Category created!';
  
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
    this.categoryForm = this.fb.group({
      name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(100)]]
    });
  }  

  protected save() {
    if(this.categoryForm.invalid) {
      this.toastService.error(`There was a problem with the ${this.errorLabel} of the category.`);
      return;
    }

    //If it is in 'edit mode', the Update is called otherwise the Create is
    const request$ = this.isEditMode ?
      this.categoriesService.updateCategory(this.data!.id, this.categoryForm.value as CategoryUpdate) :
      this.categoriesService.createCategory(this.categoryForm.value as CategoryCreate);

    this.toastService.loading(request$, {
      loading: this.loadingMessage,
      success: this.successMessage,
      error: (err) => err?.error?.title ?? 'An error occurred'
    }).subscribe({
      next: res => this.dialogRef.close(res)
    });
  }

  protected cancel() {
    this.dialogRef.close(null);
  }
}
