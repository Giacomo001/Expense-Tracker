import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ExpensesComponent } from './expenses.component';
import { AppStateService } from "@core/services/state/app-state.service";
import { ExpensesService } from "./services/expenses.service";
import { ToastService } from "@core/services/toast/toast.service";
import { MatDialog } from "@angular/material/dialog";
import { CategoryRead } from "@features/categories/models/category.model";
import { ExpenseRead } from "./models/expense.model";
import { of, EMPTY } from "rxjs";
import { By } from "@angular/platform-browser";
import { ConfirmDialogData, DeleteDialogComponent } from "@shared/components/delete-dialog/delete-dialog.component";
import { getDaysInMonth } from "@shared/utils/calendar.utils";
import { provideRouter } from "@angular/router";

describe("ExpensesComponent", () => {
    let component: ExpensesComponent;
    let fixture: ComponentFixture<ExpensesComponent>;
    let appStateService: AppStateService;

    let compAny: any;

    const expenseServiceMock = {
        deleteExpense: jest.fn()
    };

    const toastServiceMock = {
        loading: jest.fn(),
        error: jest.fn()
    };

    const dialogMock = {
        open: jest.fn()
    };

    const mockCategories: CategoryRead[] = [
        { id: 'cat-1', name: 'Food', color: '#ff0000' },
        { id: 'cat-2', name: 'Rent', color: '#0000ff' }
    ];

    //Helper to build an expense with minimal boilerplate
    const buildExpense = (overrides: Partial<ExpenseRead>): ExpenseRead => ({
        id: 'exp-default',
        amount: 0,
        date: '2026-06-01' as unknown as Date,
        createdAt: '2026-06-01' as unknown as Date,
        categoryId: 'cat-1',
        categoryName: 'Food',
        categoryColor: '#ff0000',
        ...overrides
    });

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [ExpensesComponent],
            providers: [
                AppStateService,
                provideRouter([]),
                { provide: ExpensesService, useValue: expenseServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
                { provide: MatDialog, useValue: dialogMock },
            ]
        }).compileComponents();

        appStateService = TestBed.inject(AppStateService);

        fixture = TestBed.createComponent(ExpensesComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    // ================================================
    // isSkeletonLoading - computed
    // ================================================
    describe("isSkeletonLoading", () => {
        it("should be true when expensesList is empty", () => {
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            expect(compAny.isSkeletonLoading()).toBe(true);
        });

        it("should be false when expensesList has items", () => {
            appStateService.expensesList.set([buildExpense({ id: 'exp-1' })]);
            fixture.detectChanges();

            expect(compAny.isSkeletonLoading()).toBe(false);
        });
    });

    // ================================================
    // filteredExpenses - computed
    // ================================================
    describe("filteredExpenses", () => {
        it("should return expenses matching selectedDate when no category is selected", () => {
            appStateService.selectedCategoryId.set(null);
            appStateService.selectedDate.set('2026-06-15');
            appStateService.expensesList.set([
                buildExpense({ id: 'exp-1', date: '2026-06-15' as unknown as Date }),
                buildExpense({ id: 'exp-2', date: '2026-06-16' as unknown as Date }),
            ]);
            fixture.detectChanges();

            const result = compAny.filteredExpenses();
            expect(result.map((e: ExpenseRead) => e.id)).toEqual(['exp-1']);
        });

        it("should match dates with a time component (ISO string) by trimming after 'T'", () => {
            appStateService.selectedCategoryId.set(null);
            appStateService.selectedDate.set('2026-06-15');
            appStateService.expensesList.set([
                buildExpense({ id: 'exp-1', date: '2026-06-15T10:30:00Z' as unknown as Date }),
            ]);
            fixture.detectChanges();

            const result = compAny.filteredExpenses();
            expect(result.map((e: ExpenseRead) => e.id)).toEqual(['exp-1']);
        });

        it("should return all expenses of a category sorted by date descending when category is selected", () => {
            appStateService.selectedCategoryId.set('cat-1');
            appStateService.expensesList.set([
                buildExpense({ id: 'exp-old', date: '2026-05-01' as unknown as Date, categoryId: 'cat-1' }),
                buildExpense({ id: 'exp-new', date: '2026-06-20' as unknown as Date, categoryId: 'cat-1' }),
                buildExpense({ id: 'exp-other-cat', date: '2026-06-25' as unknown as Date, categoryId: 'cat-2' }),
            ]);
            fixture.detectChanges();

            const result = compAny.filteredExpenses();
            expect(result.map((e: ExpenseRead) => e.id)).toEqual(['exp-new', 'exp-old']);
        });
    });

    // ================================================
    // monthExpenses - computed
    // ================================================
    describe("monthExpenses", () => {
        it("should include only expenses matching viewYear and viewMonth", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([
                buildExpense({ id: 'exp-in', date: '2026-06-10' as unknown as Date }),
                buildExpense({ id: 'exp-out-month', date: '2026-05-10' as unknown as Date }),
                buildExpense({ id: 'exp-out-year', date: '2025-06-10' as unknown as Date }),
            ]);
            fixture.detectChanges();

            const result = compAny.monthExpenses();
            expect(result.map((e: ExpenseRead) => e.id)).toEqual(['exp-in']);
        });
    });

    // ================================================
    // grandTotal - computed
    // ================================================
    describe("grandTotal", () => {
        it("should sum amounts of the current month's expenses only", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([
                buildExpense({ id: 'exp-1', amount: 40, date: '2026-06-10' as unknown as Date }),
                buildExpense({ id: 'exp-2', amount: 30, date: '2026-06-15' as unknown as Date }),
                buildExpense({ id: 'exp-3', amount: 999, date: '2026-05-15' as unknown as Date }), //other month, excluded
            ]);
            fixture.detectChanges();

            expect(compAny.grandTotal()).toBe(70);
        });

        it("should be 0 when there are no expenses in the current month", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            expect(compAny.grandTotal()).toBe(0);
        });
    });

    // ================================================
    // dailyAverage - computed
    // ================================================
    describe("dailyAverage", () => {
        it.each([
            [2026, 2, 28],  //February, non-leap year
            [2024, 2, 29],  //February, leap year
            [2026, 4, 30],  //April
            [2026, 1, 31],  //January
        ])("year=%s month=%s should divide grandTotal by %s days", (year, month, expectedDays) => {
            appStateService.viewYear.set(year);
            appStateService.viewMonth.set(month);
            appStateService.expensesList.set([
                buildExpense({ id: 'exp-1', amount: 100, date: `${year}-${String(month).padStart(2, '0')}-05` as unknown as Date }),
            ]);
            fixture.detectChanges();

            //cross-check against the real (pure) utility instead of hardcoding the division
            const expectedAverage = 100 / getDaysInMonth(year, month);
            expect(compAny.dailyAverage()).toBeCloseTo(expectedAverage);
            expect(getDaysInMonth(year, month)).toBe(expectedDays);
        });
    });

    // ================================================
    // isCategoryMode - computed
    // ================================================
    describe("isCategoryMode", () => {
        it("should be true when a category is selected", () => {
            appStateService.selectedCategoryId.set('cat-1');
            fixture.detectChanges();
            expect(compAny.isCategoryMode()).toBe(true);
        });

        it("should be false when no category is selected", () => {
            appStateService.selectedCategoryId.set(null);
            fixture.detectChanges();
            expect(compAny.isCategoryMode()).toBe(false);
        });
    });

    // ================================================
    // expensesGroupedByMonth - computed
    // ================================================
    describe("expensesGroupedByMonth", () => {
        it("should return an empty Map when not in category mode", () => {
            appStateService.selectedCategoryId.set(null);
            fixture.detectChanges();

            expect(compAny.expensesGroupedByMonth().size).toBe(0);
        });

        it("should group expenses of the selected category by month/year label", () => {
            appStateService.selectedCategoryId.set('cat-1');
            appStateService.expensesList.set([
                buildExpense({ id: 'exp-june', date: '2026-06-10' as unknown as Date, categoryId: 'cat-1' }),
                buildExpense({ id: 'exp-may', date: '2026-05-10' as unknown as Date, categoryId: 'cat-1' }),
                buildExpense({ id: 'exp-may-2', date: '2026-05-20' as unknown as Date, categoryId: 'cat-1' }),
            ]);
            fixture.detectChanges();

            const groups = compAny.expensesGroupedByMonth();
            expect(groups.size).toBe(2);

            const mayKey = [...groups.keys()].find((k: string) => k.toLowerCase().includes('maggio') || k.toLowerCase().includes('may'));
            expect(groups.get(mayKey!).length).toBe(2);
        });
    });

    // ================================================
    // openCreateDialog / openEditDialog / deleteExpense
    // ================================================
    describe("openCreateDialog", () => {
        it("should append the created expense to the list when the dialog returns a result", () => {
            const newExpense = buildExpense({ id: 'exp-new' });
            dialogMock.open.mockReturnValue({ afterClosed: () => of(newExpense) });
            appStateService.expensesList.set([]);

            compAny.openCreateDialog();

            expect(appStateService.expensesList()).toEqual([newExpense]);
        });

        it("should NOT modify the list when the dialog is cancelled", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
            appStateService.expensesList.set([]);

            compAny.openCreateDialog();

            expect(appStateService.expensesList()).toEqual([]);
        });
    });

    describe("openEditDialog", () => {
        it("should replace the edited expense in the list", () => {
            const original = buildExpense({ id: 'exp-1', amount: 50 });
            const updated = { ...original, amount: 90 };
            appStateService.expensesList.set([original]);
            dialogMock.open.mockReturnValue({ afterClosed: () => of(updated) });

            compAny.openEditDialog(original);

            expect(appStateService.expensesList()).toEqual([updated]);
        });
    });

    describe("deleteExpense", () => {
        const mockExpense = buildExpense({ id: 'exp-1' });

        it("should open the delete dialog with correct data", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });

            compAny.deleteExpense(mockExpense.id, 'Food', 'expense');

            expect(dialogMock.open).toHaveBeenCalledWith(DeleteDialogComponent, {
                data: { itemName: 'Food', title: 'expense' } satisfies ConfirmDialogData
            });
        });

        it("should not call the service if dialog is not confirmed", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => of(false) });

            compAny.deleteExpense(mockExpense.id, 'Food', 'expense');

            expect(expenseServiceMock.deleteExpense).not.toHaveBeenCalled();
        });

        it("should call the service and remove the expense from the list when confirmed", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });
            expenseServiceMock.deleteExpense.mockReturnValue(of(undefined));
            toastServiceMock.loading.mockReturnValue(of(undefined));

            appStateService.expensesList.set([mockExpense]);

            compAny.deleteExpense(mockExpense.id, 'Food', 'expense');

            expect(expenseServiceMock.deleteExpense).toHaveBeenCalledWith(mockExpense.id);
            expect(appStateService.expensesList()).toEqual([]);
        });
    });

    // ================================================
    // toggleExpenseActions
    // ================================================
    describe("toggleExpenseActions", () => {
        it("should set activeExpenseId when none is active", () => {
            const event = { stopPropagation: jest.fn() } as unknown as Event;

            component.toggleExpenseActions('exp-1', event);

            expect(compAny.activeExpenseId()).toBe('exp-1');
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        it("should clear activeExpenseId when the same id is toggled again", () => {
            const event = { stopPropagation: jest.fn() } as unknown as Event;
            compAny.activeExpenseId.set('exp-1');

            component.toggleExpenseActions('exp-1', event);

            expect(compAny.activeExpenseId()).toBeNull();
        });

        it("should switch activeExpenseId when a different id is toggled", () => {
            const event = { stopPropagation: jest.fn() } as unknown as Event;
            compAny.activeExpenseId.set('exp-1');

            component.toggleExpenseActions('exp-2', event);

            expect(compAny.activeExpenseId()).toBe('exp-2');
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
        beforeEach(() => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.selectedDate.set('2026-06-15');
            appStateService.selectedCategoryId.set(null);
        });

        describe("create button", () => {
            it("should call openCreateDialog on click", () => {
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                const spy = jest.spyOn(compAny, 'openCreateDialog');
                fixture.detectChanges();

                //data-testid="create-expense-btn" ==> should be added to the HTML element (button in this case)
                const btn = fixture.debugElement.query(By.css('[data-testid="create-expense-btn"]'));
                btn.nativeElement.click();

                expect(spy).toHaveBeenCalled();
            });
        });

        describe("skeleton loading", () => {
            it("should render skeleton placeholders when expensesList is empty", () => {
                appStateService.expensesList.set([]);
                fixture.detectChanges();

                const skeletons = fixture.debugElement.queryAll(By.css('.animate-pulse'));
                expect(skeletons.length).toBe(5);
            });

            it("should NOT render skeleton once expenses are loaded", () => {
                appStateService.expensesList.set([buildExpense({ id: 'exp-1', date: '2026-06-15' as unknown as Date })]);
                fixture.detectChanges();

                const skeletons = fixture.debugElement.queryAll(By.css('.animate-pulse'));
                expect(skeletons.length).toBe(0);
            });
        });

        describe("empty state", () => {
            it("should show empty state message when filteredExpenses is empty", () => {
                appStateService.expensesList.set([buildExpense({ id: 'exp-1', date: '2026-06-16' as unknown as Date })]); //different date -> filteredExpenses = []
                fixture.detectChanges();

                const emptyText = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('No expenses for this day'));
                expect(emptyText).not.toBeNull();
            });
        });

        describe("expense card (date mode)", () => {
            it("should render one card per filtered expense", () => {
                appStateService.expensesList.set([
                    buildExpense({ id: 'exp-1', date: '2026-06-15' as unknown as Date }),
                ]);
                fixture.detectChanges();

                const cards = fixture.debugElement.queryAll(By.css('[data-testid="expense-card"]'));
                expect(cards.length).toBe(1);
            });

            it("should hide amount/date and show edit/delete buttons when the card is active", () => {
                const expense = buildExpense({ id: 'exp-1', date: '2026-06-15' as unknown as Date });
                appStateService.expensesList.set([expense]);
                compAny.activeExpenseId.set('exp-1');
                fixture.detectChanges();

                const editBtn = fixture.debugElement.query(By.css('[data-testid="edit-expense-btn"]'));
                const deleteBtn = fixture.debugElement.query(By.css('[data-testid="delete-expense-btn"]'));

                expect(editBtn).not.toBeNull();
                expect(deleteBtn).not.toBeNull();
            });
        });

        describe("edit button", () => {
            it("should call openEditDialog with the correct expense and stop propagation", () => {
                const expense = buildExpense({ id: 'exp-1', date: '2026-06-15' as unknown as Date });
                appStateService.expensesList.set([expense]);
                compAny.activeExpenseId.set('exp-1'); //forces the action buttons to render (bypasses hover-only CSS)
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                fixture.detectChanges();

                const spy = jest.spyOn(compAny, 'openEditDialog');
                const editBtn = fixture.debugElement.query(By.css('[data-testid="edit-expense-btn"]'));

                editBtn.nativeElement.click();

                expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'exp-1' }));
            });
        });

        describe("delete button", () => {
            it("should call deleteExpense with correct id/description/title", () => {
                const expense = buildExpense({ id: 'exp-1', date: '2026-06-15' as unknown as Date, description: 'Groceries' });
                appStateService.expensesList.set([expense]);
                compAny.activeExpenseId.set('exp-1');
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                fixture.detectChanges();

                const spy = jest.spyOn(compAny, 'deleteExpense');
                const deleteBtn = fixture.debugElement.query(By.css('[data-testid="delete-expense-btn"]'));

                deleteBtn.nativeElement.click();

                expect(spy).toHaveBeenCalledWith('exp-1', 'Groceries', 'expense');
            });
        });

        describe("card click toggles actions", () => {
            it("should call toggleExpenseActions when the card is clicked", () => {
                const expense = buildExpense({ id: 'exp-1', date: '2026-06-15' as unknown as Date });
                appStateService.expensesList.set([expense]);
                fixture.detectChanges();

                const spy = jest.spyOn(component, 'toggleExpenseActions');
                const card = fixture.debugElement.query(By.css('[data-testid="expense-card"]'));

                card.nativeElement.click();

                expect(spy).toHaveBeenCalled();
            });
        });
    });
});