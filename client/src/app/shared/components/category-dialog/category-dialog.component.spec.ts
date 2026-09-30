import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CategoryDialogComponent } from './category-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CategoriesService } from "@features/categories/services/categories.service";
import { ToastService } from "@core/services/toast/toast.service";
import { CategoryRead } from "@features/categories/models/category.model";
import { of, throwError } from "rxjs";
import { By } from "@angular/platform-browser";

describe("CategoryDialogComponent", () => {
    let component: CategoryDialogComponent;
    let fixture: ComponentFixture<CategoryDialogComponent>;
    let compAny: any;

    const dialogRefMock = { close: jest.fn() };
    const categoriesServiceMock = { createCategory: jest.fn(), updateCategory: jest.fn() };
    const toastServiceMock = { loading: jest.fn(), error: jest.fn() };

    const mockCategory: CategoryRead = { id: 'cat-1', name: 'Food', color: '#ff0000' };

    const setup = (data: CategoryRead | null) => {
        return TestBed.configureTestingModule({
            imports: [CategoryDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: dialogRefMock },
                { provide: CategoriesService, useValue: categoriesServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(CategoryDialogComponent);
            component = fixture.componentInstance;
            compAny = (component as any);
            fixture.detectChanges();
        });
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    // ================================================
    // Mode detection / form initialization
    // ================================================
    describe("create mode (data = null)", () => {
        beforeEach(async () => { await setup(null); });

        it("should initialize isEditMode to false", () => {
            expect(compAny.isEditMode).toBe(false);
        });

        it("should initialize the form with an empty name", () => {
            expect(compAny.categoryForm.value.name).toBe('');
        });

        it("should set modeLabel to 'Create'", () => {
            expect(compAny.modeLabel).toBe('Create');
        });
    });

    describe("edit mode (data = existing category)", () => {
        beforeEach(async () => { await setup(mockCategory); });

        it("should initialize isEditMode to true", () => {
            expect(compAny.isEditMode).toBe(true);
        });

        it("should pre-fill the form with the existing name", () => {
            expect(compAny.categoryForm.value.name).toBe('Food');
        });

        it("should set modeLabel to 'Update'", () => {
            expect(compAny.modeLabel).toBe('Update');
        });
    });

    // ================================================
    // Form validators
    // ================================================
    describe("categoryForm validators", () => {
        beforeEach(async () => { await setup(null); });

        it("should be invalid when name is empty", () => {
            compAny.categoryForm.get('name')?.setValue('');
            expect(compAny.categoryForm.valid).toBe(false);
        });

        it("should be invalid when name exceeds 100 characters", () => {
            compAny.categoryForm.get('name')?.setValue('a'.repeat(101));
            expect(compAny.categoryForm.get('name')?.hasError('maxlength')).toBe(true);
        });

        it("should be valid with a proper name", () => {
            compAny.categoryForm.get('name')?.setValue('Groceries');
            expect(compAny.categoryForm.valid).toBe(true);
        });
    });

    // ================================================
    // save
    // ================================================
    describe("save", () => {
        beforeEach(async () => { await setup(null); });

        it("should show an error toast and not call the service when form is invalid", () => {
            compAny.categoryForm.get('name')?.setValue('');

            compAny.save();

            expect(toastServiceMock.error).toHaveBeenCalled();
            expect(categoriesServiceMock.createCategory).not.toHaveBeenCalled();
        });

        it("should call createCategory when in create mode", () => {
            toastServiceMock.loading.mockReturnValue(of(mockCategory));
            compAny.categoryForm.get('name')?.setValue('Groceries');

            compAny.save();

            expect(categoriesServiceMock.createCategory).toHaveBeenCalledWith({ name: 'Groceries' });
            expect(categoriesServiceMock.updateCategory).not.toHaveBeenCalled();
        });

        it("should close the dialog with the created category on success", () => {
            toastServiceMock.loading.mockReturnValue(of(mockCategory));
            compAny.categoryForm.get('name')?.setValue('Groceries');

            compAny.save();

            expect(dialogRefMock.close).toHaveBeenCalledWith(mockCategory);
        });

        it("should NOT close the dialog when the request errors out", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { title: 'Name already exists' } })));
            compAny.categoryForm.get('name')?.setValue('Groceries');

            compAny.save();

            expect(dialogRefMock.close).not.toHaveBeenCalled();
        });
    });

    describe("save (edit mode)", () => {
        beforeEach(async () => { await setup(mockCategory); });

        it("should call updateCategory with the category id when in edit mode", () => {
            toastServiceMock.loading.mockReturnValue(of({ ...mockCategory, name: 'Groceries' }));
            compAny.categoryForm.get('name')?.setValue('Groceries');

            compAny.save();

            expect(categoriesServiceMock.updateCategory).toHaveBeenCalledWith('cat-1', { name: 'Groceries' });
            expect(categoriesServiceMock.createCategory).not.toHaveBeenCalled();
        });
    });

    // ================================================
    // cancel
    // ================================================
    describe("cancel", () => {
        beforeEach(async () => { await setup(null); });

        it("should close the dialog with no result", () => {
            compAny.cancel();
            expect(dialogRefMock.close).toHaveBeenCalledWith(null);
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
        beforeEach(async () => { await setup(null); });

        it("should disable the save button when the form is invalid", () => {
            const btn = fixture.debugElement.query(el => el.nativeElement.textContent?.trim() === 'Create');
            expect(btn.nativeElement.disabled).toBe(true);
        });

        it("should enable the save button when the form is valid", () => {
            compAny.categoryForm.get('name')?.setValue('Groceries');
            fixture.detectChanges();

            const btn = fixture.debugElement.query(el => el.nativeElement.textContent?.trim() === 'Create');
            expect(btn.nativeElement.disabled).toBe(false);
        });
    });
});