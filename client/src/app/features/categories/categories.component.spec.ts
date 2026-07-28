import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CategoriesComponent } from './categories.component';
import { AppStateService } from "@core/services/state/app-state.service";
import { CategoriesService } from "./services/categories.service";
import { ToastService } from "@core/services/toast/toast.service";
import { AuthService } from "@core/services/auth/auth.service";
import { MatDialog } from "@angular/material/dialog";
import { CategoryRead } from "./models/category.model";
import { of, EMPTY } from "rxjs";
import { By } from "@angular/platform-browser";
import { ConfirmDialogData, DeleteDialogComponent } from "@shared/components/delete-dialog/delete-dialog.component";
import { provideRouter } from "@angular/router";

describe("CategoriesComponent", () => {
    let component: CategoriesComponent;
    let fixture: ComponentFixture<CategoriesComponent>;
    let appStateService: AppStateService;

    let compAny: any;

    const categoriesServiceMock = {
        deleteCategory: jest.fn()
    };

    const toastServiceMock = {
        loading: jest.fn()
    };

    const authServiceMock = {
        logoutLocally: jest.fn()
    };

    const dialogMock = {
        open: jest.fn()
    };

    const buildCategory = (overrides: Partial<CategoryRead>): CategoryRead => ({
        id: 'cat-default',
        name: 'Food',
        color: '#ff0000',
        ...overrides
    });

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [CategoriesComponent],
            providers: [
                AppStateService,
                provideRouter([]),
                { provide: CategoriesService, useValue: categoriesServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
                { provide: AuthService, useValue: authServiceMock },
                { provide: MatDialog, useValue: dialogMock },
            ]
        }).compileComponents();

        appStateService = TestBed.inject(AppStateService);

        fixture = TestBed.createComponent(CategoriesComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    // ================================================
    // selectCategory - Method
    // ================================================
    describe("selectCategory", () => {
        it("should update selectedCategoryId signal", () => {
            compAny.selectCategory('cat-1');
            expect(appStateService.selectedCategoryId()).toBe('cat-1');
        });

        it("should emit the selected id via categorySelected output", () => {
            const emitSpy = jest.spyOn(component.categorySelected, 'emit');
            compAny.selectCategory('cat-1');
            expect(emitSpy).toHaveBeenCalledWith('cat-1');
        });

        it("should support null to select the default category", () => {
            appStateService.selectedCategoryId.set('cat-1');
            compAny.selectCategory(null);
            expect(appStateService.selectedCategoryId()).toBeNull();
        });
    });

    // ================================================
    // openCreateDialog
    // ================================================
    describe("openCreateDialog", () => {
        it("should open the dialog with null data (create mode)", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });

            compAny.openCreateDialog();

            expect(dialogMock.open).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ data: null })
            );
        });

        it("should append the created category to the list", () => {
            const newCategory = buildCategory({ id: 'cat-new' });
            dialogMock.open.mockReturnValue({ afterClosed: () => of(newCategory) });
            appStateService.categoriesList.set([]);

            compAny.openCreateDialog();

            expect(appStateService.categoriesList()).toEqual([newCategory]);
        });

        it("should NOT modify the list when the dialog is cancelled", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
            appStateService.categoriesList.set([]);

            compAny.openCreateDialog();

            expect(appStateService.categoriesList()).toEqual([]);
        });
    });

    // ================================================
    // openEditDialog
    // ================================================
    describe("openEditDialog", () => {
        it("should open the dialog pre-filled with the category (edit mode)", () => {
            const category = buildCategory({ id: 'cat-1' });
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });

            compAny.openEditDialog(category);

            expect(dialogMock.open).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ data: category })
            );
        });

        it("should replace the edited category in the list", () => {
            const original = buildCategory({ id: 'cat-1', name: 'Food' });
            const updated = { ...original, name: 'Groceries' };
            appStateService.categoriesList.set([original]);
            dialogMock.open.mockReturnValue({ afterClosed: () => of(updated) });

            compAny.openEditDialog(original);

            expect(appStateService.categoriesList()).toEqual([updated]);
        });
    });

    // ================================================
    // deleteCategory
    // ================================================
    describe("deleteCategory", () => {
        it("should open the delete dialog with the correct name/title", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });

            compAny.deleteCategory('cat-1', 'Food', 'category');

            expect(dialogMock.open).toHaveBeenCalledWith(DeleteDialogComponent, {
                data: { itemName: 'Food', title: 'category' } satisfies ConfirmDialogData
            });
        });

        it("should not call the service if dialog is not confirmed", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => of(false) });

            compAny.deleteCategory('cat-1', 'Food', 'category');

            expect(categoriesServiceMock.deleteCategory).not.toHaveBeenCalled();
        });

        it("should call the service and remove the category from the list when confirmed", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });
            categoriesServiceMock.deleteCategory.mockReturnValue(of(undefined));
            toastServiceMock.loading.mockReturnValue(of(undefined));

            appStateService.categoriesList.set([buildCategory({ id: 'cat-1' })]);

            compAny.deleteCategory('cat-1', 'Food', 'category');

            expect(categoriesServiceMock.deleteCategory).toHaveBeenCalledWith('cat-1');
            expect(appStateService.categoriesList()).toEqual([]);
        });
    });

    // ================================================
    // logout
    // ================================================
    describe("logout", () => {
        it("should call AuthService.logoutLocally", () => {
            compAny.logout();
            expect(authServiceMock.logoutLocally).toHaveBeenCalled();
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
        describe("default category row", () => {
            it("should call selectCategory(null) on click", () => {
                const spy = jest.spyOn(compAny, 'selectCategory');
                fixture.detectChanges();

                const row = fixture.debugElement.query(el => el.nativeElement.textContent?.trim() === 'Default');
                row.nativeElement.click();

                expect(spy).toHaveBeenCalledWith(null);
            });
        });

        describe("category row", () => {
            it("should call selectCategory with the category id on click", () => {
                appStateService.categoriesList.set([buildCategory({ id: 'cat-1', name: 'Food' })]);
                fixture.detectChanges();
                const spy = jest.spyOn(compAny, 'selectCategory');

                const row = fixture.debugElement.query(By.css('[data-testid="category-row"]'));
                row.nativeElement.click();

                expect(spy).toHaveBeenCalledWith('cat-1');
            });

            it("should render one row per category", () => {
                appStateService.categoriesList.set([
                    buildCategory({ id: 'cat-1', name: 'Food' }),
                    buildCategory({ id: 'cat-2', name: 'Rent' }),
                ]);
                fixture.detectChanges();

                const editButtons = fixture.debugElement.queryAll(By.css('[data-testid="edit-category-btn"]'));
                expect(editButtons.length).toBe(2);
            });
        });

        describe("edit button", () => {
            it("should call openEditDialog with the correct category and stop propagation", () => {
                const category = buildCategory({ id: 'cat-1', name: 'Food' });
                appStateService.categoriesList.set([category]);
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                fixture.detectChanges();

                const selectSpy = jest.spyOn(compAny, 'selectCategory');
                const editSpy = jest.spyOn(compAny, 'openEditDialog');
                const editBtn = fixture.debugElement.query(By.css('[data-testid="edit-category-btn"]'));

                editBtn.nativeElement.click();

                expect(editSpy).toHaveBeenCalledWith(category);
                //stopPropagation check: clicking edit must NOT also trigger the row's selectCategory
                expect(selectSpy).not.toHaveBeenCalled();
            });
        });

        describe("delete button", () => {
            it("should call deleteCategory with correct id/name/title and stop propagation", () => {
                const category = buildCategory({ id: 'cat-1', name: 'Food' });
                appStateService.categoriesList.set([category]);
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                fixture.detectChanges();

                const selectSpy = jest.spyOn(compAny, 'selectCategory');
                const deleteSpy = jest.spyOn(compAny, 'deleteCategory');
                const deleteBtn = fixture.debugElement.query(By.css('[data-testid="delete-category-btn"]'));

                deleteBtn.nativeElement.click();

                expect(deleteSpy).toHaveBeenCalledWith('cat-1', 'Food', 'category');
                expect(selectSpy).not.toHaveBeenCalled();
            });
        });

        describe("add category button", () => {
            it("should call openCreateDialog on click", () => {
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                const spy = jest.spyOn(compAny, 'openCreateDialog');
                fixture.detectChanges();

                //NOTE: relies on the data-testid fix from "logout-category-div" to "add-category-div"
                const addBtn = fixture.debugElement.query(By.css('[data-testid="add-category-div"]'));
                addBtn.nativeElement.click();

                expect(spy).toHaveBeenCalled();
            });
        });

        describe("logout button", () => {
            it("should call logout on click", () => {
                const spy = jest.spyOn(compAny, 'logout');
                fixture.detectChanges();

                const logoutBtn = fixture.debugElement.query(By.css('[data-testid="logout-category-btn"]'));
                logoutBtn.nativeElement.click();

                expect(spy).toHaveBeenCalled();
            });
        });
    });
});