import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BudgetsComponent } from './budgets.component';
import { AppStateService } from "@core/services/state/app-state.service";
import { BudgetsService } from "./services/budgets.service";
import { CategoryRead } from "@features/categories/models/category.model";
import { BudgetRead } from "./models/budget.model";
import { ToastService } from "@core/services/toast/toast.service";
import { MatDialog } from "@angular/material/dialog";
import { provideRouter } from "@angular/router";
import { EMPTY, of } from "rxjs";
import { ConfirmDialogData, DeleteDialogComponent } from "@shared/components/delete-dialog/delete-dialog.component";
import { By } from "@angular/platform-browser";

describe("BudgetsComponent", () => {
    let component: BudgetsComponent;
    let fixture: ComponentFixture<BudgetsComponent>;
    let appStateService: AppStateService;

    //Component - outside of the tests so it's easier to use
    let compAny: any;

    //Mocks only services with side effects — BudgetsService, ToastService, MatDialog
    //AppStateService is used as-is because we want to test real signal reactivity
    const budgetServiceMock = {
        createBudget: jest.fn(),
        updateBudget: jest.fn(),
        deleteBudget: jest.fn()
    };

    const toastServiceMock = {
        loading: jest.fn(),
        error: jest.fn()
    };

    const dialogMock = {
        open: jest.fn()
    };

    //Reusable mock data
    const mockCategories: CategoryRead[] = [
        { id: 'cat-1', name: 'Food', color: '#ff0000' },
        { id: 'cat-2', name: 'Rent', color: '#0000ff' }
    ];

    const mockBudgets: BudgetRead[] = [
        { id: 'bud-1', amount: 100, categoryId: 'cat-1', categoryName: 'Food', categoryColor: '#ff0000' }
        //[1]: cat-2 has NO budget — to test the null case
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BudgetsComponent],
            providers: [
                AppStateService, //Real instance, used to check the reading and setting of the signals
                provideRouter([]),
                { provide: BudgetsService, useValue: budgetServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
                { provide: MatDialog, useValue: dialogMock },
            ]
        }).compileComponents();

        //Get the real AppStateService instance from TestBed
        appStateService = TestBed.inject(AppStateService);

        fixture = TestBed.createComponent(BudgetsComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    // ================================================
    // categoriesWithBudget - computed
    // ================================================
    describe("categoriesWithBudget", () => {
        beforeEach(() => {
            //Set the variables so they meet the expenses dates
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.categoriesList.set(mockCategories);
            appStateService.budgetsList.set(mockBudgets);
        });

        it("should set budget to null when category has no matching budget", () => {
            //cat-2 has no budget in mockBudgets
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            const result = compAny.categoriesWithBudget();
            expect(result[1].budget).toBeNull(); //result[1] = cat-2
        });

        it("should merge category with the appropriate budget", () => {
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            const result = compAny.categoriesWithBudget();
            expect(result[0].budget).toEqual(mockBudgets[0]);
        });

        it("should calculate spent as sum of expenses for the correct category and month", () => {
            appStateService.expensesList.set([
                {
                    id: 'exp-1', 
                    amount: 40,
                    date: '2026-06-15' as unknown as Date,
                    createdAt: '2026-06-15' as unknown as Date,
                    categoryId: 'cat-1', 
                    categoryName: 'Food', 
                    categoryColor: '#ff0000'
                },
                {
                    id: 'exp-2', 
                    amount: 30,
                    date: '2026-06-20' as unknown as Date,
                    createdAt: '2026-06-20' as unknown as Date,
                    categoryId: 'cat-1', 
                    categoryName: 'Food', 
                    categoryColor: '#ff0000'
                }
            ]);
            fixture.detectChanges();

            const result = compAny.categoriesWithBudget();
            expect(result[0].spent).toBe(70);
        });

        it("should exclude expenses from different months", () => {
            appStateService.expensesList.set([
                {
                    id: 'exp-1', 
                    amount: 100,
                    date: '2026-06-15' as unknown as Date,
                    createdAt: '2026-06-15' as unknown as Date,
                    categoryId: 'cat-1', 
                    categoryName: 'Food', 
                    categoryColor: '#ff0000'
                },
                {
                    id: 'exp-2', 
                    amount: 400,
                    date: '2026-05-20' as unknown as Date,
                    createdAt: '2026-05-20' as unknown as Date,
                    categoryId: 'cat-1', 
                    categoryName: 'Food', 
                    categoryColor: '#ff0000'
                }
            ]);
            fixture.detectChanges();

            const result = compAny.categoriesWithBudget();
            expect(result[0].spent).toBe(100); //Difference Date --> not 500 but 100
        });

        it("should calculate percentage correctly", () => {
            appStateService.expensesList.set([
                {
                    id: 'exp-1', 
                    amount: 70,
                    date: '2026-06-15' as unknown as Date,
                    createdAt: '2026-06-15' as unknown as Date,
                    categoryId: 'cat-1', 
                    categoryName: 'Food', 
                    categoryColor: '#ff0000'
                }
            ]);
            fixture.detectChanges();

            const result = compAny.categoriesWithBudget();
            expect(result[0].percentage).toBe(70); //Budget is 100
        });

        it("should cap percentage at 100 when spent exceeds budget", () => {
            appStateService.expensesList.set([
                {
                    id: 'exp-1', 
                    amount: 140,
                    date: '2026-06-15' as unknown as Date,
                    createdAt: '2026-06-15' as unknown as Date,
                    categoryId: 'cat-1', 
                    categoryName: 'Food', 
                    categoryColor: '#ff0000'
                }
            ]);
            fixture.detectChanges();

            const result = compAny.categoriesWithBudget();
            expect(result[0].percentage).toBe(100); //Budget is 100
        });

        it("should set isOverBudget to true when spent exceeds budget amount", () => {
            appStateService.expensesList.set([
                {
                    id: 'exp-1', 
                    amount: 140,
                    date: '2026-06-15' as unknown as Date,
                    createdAt: '2026-06-15' as unknown as Date,
                    categoryId: 'cat-1', 
                    categoryName: 'Food', 
                    categoryColor: '#ff0000'
                }
            ]);
            fixture.detectChanges();

            const result = compAny.categoriesWithBudget();
            expect(result[0].isOverBudget).toBe(true); //Budget is 100
        });

        it("should set isOverBudget to false when spent is within budget", () => {
            appStateService.expensesList.set([
                {
                    id: 'exp-1', 
                    amount: 80,
                    date: '2026-06-15' as unknown as Date,
                    createdAt: '2026-06-15' as unknown as Date,
                    categoryId: 'cat-1', 
                    categoryName: 'Food', 
                    categoryColor: '#ff0000'
                }
            ]);
            fixture.detectChanges();

            const result = compAny.categoriesWithBudget();
            expect(result[0].isOverBudget).toBe(false); //Budget is 100
        });
    });

    // ================================================
    // startEditing - Method
    // ================================================
    describe("startEditing", () => {
        it("should set editing signals with passed parameters", () => {
            compAny.startEditing("cat-1", 100);

            expect(compAny.editingCategoryId()).toBe("cat-1");
            expect(compAny.editingAmount()).toBe(100);
        });
    });

    // ================================================
    // cancelEdit - Method
    // ================================================
    describe("cancelEdit", () => {
        it("should reset the edting signals when cancelEdit is called", () => {
            compAny.editingCategoryId.set('cat-1');
            compAny.editingAmount.set(500);

            compAny.cancelEdit();

            expect(compAny.editingCategoryId()).toBeNull();
            expect(compAny.editingAmount()).toBeNull();
        });
    });

    // ================================================
    // saveBudget - Method
    // ================================================
    describe("saveBudget", () => {
        it("should return early if amount is invalid (NULL or <= 0)", () => {
            compAny.editingAmount.set(null);
            compAny.saveBudget("cat-1", 100);

            //The collateral effect of the subscrition is tracked
            expect(toastServiceMock.loading).not.toHaveBeenCalled();
        });

        it("should call updateBudget and update the list when existingBudget is provided", () => {
            const initialBudget = mockBudgets[0];
            //If the object was a complex one, with more annidated objects in it, structuredClone() would have been a better choice
            //const initialBudget = structuredClone(appStateService.budgetsList()[0]);
            const updatingBudgetMock = { ...initialBudget, amount: 150 };

            appStateService.budgetsList.set([initialBudget]); //Populating the empty array

            //Mocking of the method - the observable returns an object
            budgetServiceMock.updateBudget.mockReturnValue(of(updatingBudgetMock));
            toastServiceMock.loading.mockReturnValue(of(updatingBudgetMock));

            compAny.editingAmount.set(150);
            compAny.saveBudget(initialBudget.categoryId, initialBudget);

            const updatedList = appStateService.budgetsList();
            const updatedBudget = updatedList.find(l => l.id == updatingBudgetMock.id);

            expect(updatedBudget?.amount).toBe(150);
            expect(compAny.editingCategoryId()).toBeNull();
        });

        it("should call createBudget and append to the list when existingBudget is null", () => {

        });
    });

    // ================================================
    // deleteBudget - Method
    // ================================================
    describe("deleteBudget", () => {
        const mockBudget = mockBudgets[0];

        it("should open delete dialog with specific budget info", () => {
            //It only checks if the dialog will open, doesn't matter the return
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY })

            compAny.deleteBudget(mockBudget);

            expect(dialogMock.open).toHaveBeenCalledWith(DeleteDialogComponent, {
                data: { itemName: mockBudget.categoryName, title: 'Budget'} satisfies ConfirmDialogData
            });
        });

        it("should not call the delete method if dialog is not confirmed", () => {
            //The dialog is not confirmed
            dialogMock.open.mockReturnValue({ afterClosed: () => of(false) });

            compAny.deleteBudget(mockBudget);

            //If dialog is cancelled, the deleteBudget method should not have been called
            expect(budgetServiceMock.deleteBudget).not.toHaveBeenCalled();
        });

        it("should call the delete method if dialog is confirmed", () => {
            //The deletion of the budget is confirmed
            dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });
            //Both method MUST return an Observable
            budgetServiceMock.deleteBudget.mockReturnValue(of(undefined));
            toastServiceMock.loading.mockReturnValue(of(undefined));

            compAny.deleteBudget(mockBudget);

            expect(budgetServiceMock.deleteBudget).toHaveBeenCalledWith(mockBudget.id);
        });

        it("should remove the deleted budget from the list", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });
            budgetServiceMock.deleteBudget.mockReturnValue(of(undefined));
            toastServiceMock.loading.mockReturnValue(of(undefined));

            const otherBudget: BudgetRead = { id: 'bud-2', amount: 50, categoryId: 'cat-1', categoryName: 'Food', categoryColor: '#ff0000' };
            appStateService.budgetsList.set([mockBudgets[0], otherBudget]); //A new budget is added to the list

            compAny.deleteBudget(mockBudget);

            expect(appStateService.budgetsList()).toEqual([otherBudget]);
        });
    });

    describe("getErrorMessage", () => {
        it("should return the error title when present", () => {
            expect(compAny.getErrorMessage({ error: { title: 'Budget in use' } }))
                .toBe('Budget in use');
        });

        it("should return a generic string as a fallback", () => {
            expect(compAny.getErrorMessage({})).toBe('An error occurred');
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
        /*
            categoriesWithBudget is a computed in the AppStateService (not mocked)
            it really changes its state for every variable that changes
        */

        beforeEach(() => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([]); //No expense, spent = 0
        });

        describe("deleteButton", () => {
            it("should open the delete dialog when clicked", () => {
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                appStateService.categoriesList.set([mockCategories[0]]); //cat-1
                appStateService.budgetsList.set([mockBudgets[0]]); //budget for cat-1
                fixture.detectChanges();

                const btn = fixture.debugElement.query(By.css('[data-testid="delete-budget-btn"]'));
                btn.nativeElement.click();

                expect(dialogMock.open).toHaveBeenCalled();
            });

            it("should NOT render when the category has no budget", () => {
                appStateService.categoriesList.set([mockCategories[1]]); //cat-2, no budget
                appStateService.budgetsList.set([]);
                fixture.detectChanges();

                const btn = fixture.debugElement.query(By.css('[data-testid="delete-budget-btn"]'));
                expect(btn).toBeNull();
            });
        });

        describe("edit/addButton", () => {
            it("should call startEditing with existing amount when budget exists", () => {
                appStateService.categoriesList.set([mockCategories[0]]);
                appStateService.budgetsList.set([mockBudgets[0]]);
                fixture.detectChanges();
                const spy = jest.spyOn(compAny, 'startEditing');

                const btn = fixture.debugElement.query(By.css('[data-testid="edit-or-add-budget-btn"]'));
                btn.nativeElement.click();

                expect(spy).toHaveBeenCalledWith('cat-1', mockBudgets[0].amount);
            });

            it("should call startEditing with null amount when budget does not exist", () => {
                appStateService.categoriesList.set([mockCategories[1]]);
                appStateService.budgetsList.set([]);
                fixture.detectChanges();
                const spy = jest.spyOn(compAny, 'startEditing');

                const btn = fixture.debugElement.query(By.css('[data-testid="edit-or-add-budget-btn"]'));
                btn.nativeElement.click();

                expect(spy).toHaveBeenCalledWith('cat-2', null);
            });
        });

        describe("inline amount input", () => {
            it("should update editingAmount signal on input", () => {
                appStateService.categoriesList.set([mockCategories[0]]);
                appStateService.budgetsList.set([mockBudgets[0]]);
                compAny.editingCategoryId.set('cat-1');
                fixture.detectChanges();

                const input = fixture.debugElement.query(By.css('[data-testid="budget-amount-input"]'));
                input.nativeElement.value = 250;
                input.nativeElement.dispatchEvent(new Event('input'));

                expect(compAny.editingAmount()).toBe(250);
            });
        });

        describe("saveButton", () => {
            it("should call saveBudget with correct id and budget on click", () => {
                appStateService.categoriesList.set([mockCategories[0]]);
                appStateService.budgetsList.set([mockBudgets[0]]);
                compAny.editingCategoryId.set('cat-1');
                fixture.detectChanges();
                const spy = jest.spyOn(compAny, 'saveBudget');

                const btn = fixture.debugElement.query(By.css('[data-testid="save-budget-btn"]'));
                btn.nativeElement.click();

                expect(spy).toHaveBeenCalledWith('cat-1', mockBudgets[0]);
            });

            it("should call saveBudget on Enter keydown", () => {
                appStateService.categoriesList.set([mockCategories[0]]);
                appStateService.budgetsList.set([mockBudgets[0]]);
                compAny.editingCategoryId.set('cat-1');
                fixture.detectChanges();
                const spy = jest.spyOn(compAny, 'saveBudget');

                const input = fixture.debugElement.query(By.css('[data-testid="budget-amount-input"]'));
                input.triggerEventHandler('keydown.enter', {});

                expect(spy).toHaveBeenCalled();
            });
        });

        describe("cancelButton", () => {
            it("should cancel the editing mode on click", () => {
                appStateService.categoriesList.set([mockCategories[0]]);
                appStateService.budgetsList.set([mockBudgets[0]]);
                compAny.editingCategoryId.set('cat-1');
                fixture.detectChanges();
                const spy = jest.spyOn(compAny, 'cancelEdit');

                const btn = fixture.debugElement.query(By.css('[data-testid="cancel-edit-btn"]'));
                btn.nativeElement.click();

                expect(spy).toHaveBeenCalled();
            });
        });
    });
});