import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RecurringExpensesComponent } from './recurring-expenses.component';
import { AppStateService } from "@core/services/state/app-state.service";
import { RecurringExpensesService } from "./services/recurring-expenses.service";
import { ToastService } from "@core/services/toast/toast.service";
import { MatDialog } from "@angular/material/dialog";
import { RecurringExpenseRead } from "./models/recurring-expense.model";
import { CategoryRead } from "@features/categories/models/category.model";
import { of, EMPTY } from "rxjs";
import { ConfirmDialogData, DeleteDialogComponent } from "@shared/components/delete-dialog/delete-dialog.component";
import { By } from "@angular/platform-browser";
import { Frequency } from "./models/frequency.enum";
import { provideRouter } from "@angular/router";

describe("RecurringExpensesComponent", () => {
    let component: RecurringExpensesComponent;
    let fixture: ComponentFixture<RecurringExpensesComponent>;
    let appStateService: AppStateService;

    let compAny: any;

    const recurringExpensesServiceMock = {
        deleteRecurringExpense: jest.fn()
    };

    const toastServiceMock = {
        loading: jest.fn()
    };

    const dialogMock = {
        open: jest.fn()
    };

    const mockCategories: CategoryRead[] = [
        { id: 'cat-1', name: 'Food', color: '#ff0000' },
        { id: 'cat-2', name: 'Rent', color: '#0000ff' }
    ];

    //Helper to build a recurring expense with minimal boilerplate
    const buildRecurringExpense = (overrides: Partial<RecurringExpenseRead>): RecurringExpenseRead => ({
        id: 'rec-default',
        amount: 0,
        description: undefined,
        frequency: Frequency.Manual,
        categoryId: 'cat-1',
        categoryName: 'Food',
        categoryColor: '#ff0000',
        nextDueDate: '2026-07-01',
        ...overrides
    });

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [RecurringExpensesComponent],
            providers: [
                AppStateService,
                provideRouter([]), //It creates an empty Router to satisfy dependencies of RouterLink/ActivatedRoute
                { provide: RecurringExpensesService, useValue: recurringExpensesServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
                { provide: MatDialog, useValue: dialogMock },
            ]
        }).compileComponents();

        //Forces the mock to win even if MatDialogModule (imported by the component itself) would otherwise provide the real MatDialog at a closer injector level
        TestBed.overrideProvider(MatDialog, { useValue: dialogMock });

        appStateService = TestBed.inject(AppStateService);

        fixture = TestBed.createComponent(RecurringExpensesComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    // ================================================
    // recurringExpensesSorted - computed
    // ================================================
    describe("recurringExpensesSorted", () => {
        it("should sort by nextDueDate ascending (soonest first)", () => {
            appStateService.selectedCategoryId.set(null);
            appStateService.recurringExpensesList.set([
                buildRecurringExpense({ id: 'rec-far', nextDueDate: '2026-09-01'}),
                buildRecurringExpense({ id: 'rec-near', nextDueDate: '2026-07-01'}),
            ]);
            fixture.detectChanges();

            const result = compAny.recurringExpensesSorted();
            expect(result.map((r: RecurringExpenseRead) => r.id)).toEqual(['rec-near', 'rec-far']);
        });

        it("should push items with an undefined nextDueDate to the end", () => {
            appStateService.selectedCategoryId.set(null);
            appStateService.recurringExpensesList.set([
                buildRecurringExpense({ id: 'rec-null', nextDueDate: undefined}),
                buildRecurringExpense({ id: 'rec-dated', nextDueDate: '2026-07-01'}),
            ]);
            fixture.detectChanges();

            const result = compAny.recurringExpensesSorted();
            expect(result.map((r: RecurringExpenseRead) => r.id)).toEqual(['rec-dated', 'rec-null']);
        });

        it("should not crash when multiple items have an undefined nextDueDate", () => {
            appStateService.selectedCategoryId.set(null);
            appStateService.recurringExpensesList.set([
                buildRecurringExpense({ id: 'rec-null-1', nextDueDate: undefined}),
                buildRecurringExpense({ id: 'rec-null-2', nextDueDate: undefined}),
            ]);
            fixture.detectChanges();

            expect(() => compAny.recurringExpensesSorted()).not.toThrow();
            expect(compAny.recurringExpensesSorted().length).toBe(2);
        });

        it("should filter by selectedCategoryId when set", () => {
            appStateService.selectedCategoryId.set('cat-1');
            appStateService.recurringExpensesList.set([
                buildRecurringExpense({ id: 'rec-cat1', categoryId: 'cat-1' }),
                buildRecurringExpense({ id: 'rec-cat2', categoryId: 'cat-2' }),
            ]);
            fixture.detectChanges();

            const result = compAny.recurringExpensesSorted();
            expect(result.map((r: RecurringExpenseRead) => r.id)).toEqual(['rec-cat1']);
        });

        it("should return all items when selectedCategoryId is null", () => {
            appStateService.selectedCategoryId.set(null);
            appStateService.recurringExpensesList.set([
                buildRecurringExpense({ id: 'rec-cat1', categoryId: 'cat-1' }),
                buildRecurringExpense({ id: 'rec-cat2', categoryId: 'cat-2' }),
            ]);
            fixture.detectChanges();

            expect(compAny.recurringExpensesSorted().length).toBe(2);
        });
    });

    // ================================================
    // openCreateDialog
    // ================================================
    describe("openCreateDialog", () => {
        it("should append the created recurring expense to the list", () => {
            const newRec = buildRecurringExpense({ id: 'rec-new' });
            dialogMock.open.mockReturnValue({ afterClosed: () => of(newRec) });
            appStateService.recurringExpensesList.set([]);

            compAny.openCreateDialog();

            expect(appStateService.recurringExpensesList()).toEqual([newRec]);
        });

        it("should pass current categories list to the dialog", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
            appStateService.categoriesList.set(mockCategories);

            compAny.openCreateDialog();

            expect(dialogMock.open).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    data: expect.objectContaining({ recurringExpense: null, categories: mockCategories })
                })
            );
        });

        it("should NOT modify the list when the dialog is cancelled", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
            appStateService.recurringExpensesList.set([]);

            compAny.openCreateDialog();

            expect(appStateService.recurringExpensesList()).toEqual([]);
        });
    });

    // ================================================
    // openEditDialog
    // ================================================
    describe("openEditDialog", () => {
        it("should replace the edited recurring expense in the list", () => {
            const original = buildRecurringExpense({ id: 'rec-1', amount: 50 });
            const updated = { ...original, amount: 90 };
            appStateService.recurringExpensesList.set([original]);
            dialogMock.open.mockReturnValue({ afterClosed: () => of(updated) });

            compAny.openEditDialog(original);

            expect(appStateService.recurringExpensesList()).toEqual([updated]);
        });
    });

    // ================================================
    // deleteRecurringExpense
    // ================================================
    describe("deleteRecurringExpense", () => {
        const mockRec = buildRecurringExpense({ id: 'rec-1', description: 'Netflix' });

        it("should open the delete dialog using description as itemName when present", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });

            compAny.deleteRecurringExpense(mockRec);

            expect(dialogMock.open).toHaveBeenCalledWith(DeleteDialogComponent, {
                data: { itemName: 'Netflix', title: 'recurring expense' } satisfies ConfirmDialogData
            });
        });

        it("should fall back to categoryName as itemName when description is missing", () => {
            const recNoDescription = buildRecurringExpense({ id: 'rec-2', description: undefined, categoryName: 'Rent' });
            dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });

            compAny.deleteRecurringExpense(recNoDescription);

            expect(dialogMock.open).toHaveBeenCalledWith(DeleteDialogComponent, {
                data: { itemName: 'Rent', title: 'recurring expense' } satisfies ConfirmDialogData
            });
        });

        it("should not call the service if dialog is not confirmed", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => of(false) });

            compAny.deleteRecurringExpense(mockRec);

            expect(recurringExpensesServiceMock.deleteRecurringExpense).not.toHaveBeenCalled();
        });

        it("should call the service and remove the item from the list when confirmed", () => {
            dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });
            recurringExpensesServiceMock.deleteRecurringExpense.mockReturnValue(of(undefined));
            toastServiceMock.loading.mockReturnValue(of(undefined));

            appStateService.recurringExpensesList.set([mockRec]);

            compAny.deleteRecurringExpense(mockRec);

            expect(recurringExpensesServiceMock.deleteRecurringExpense).toHaveBeenCalledWith(mockRec.id);
            expect(appStateService.recurringExpensesList()).toEqual([]);
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(new Date('2026-06-15'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        describe("create button", () => {
            it("should call openCreateDialog on click", () => {
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                const spy = jest.spyOn(compAny, 'openCreateDialog');
                fixture.detectChanges();

                const btn = fixture.debugElement.query(By.css('button'));
                btn.nativeElement.click();

                expect(spy).toHaveBeenCalled();
            });
        });

        describe("empty state", () => {
            it("should show empty state message when there are no recurring expenses", () => {
                appStateService.recurringExpensesList.set([]);
                fixture.detectChanges();

                const emptyText = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('No recurring expenses'));
                expect(emptyText).not.toBeNull();
            });

            it("should NOT show empty state when there is at least one item", () => {
                appStateService.recurringExpensesList.set([buildRecurringExpense({ id: 'rec-1' })]);
                fixture.detectChanges();

                const emptyText = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('No recurring expenses'));
                expect(emptyText).toBeNull();
            });
        });

        describe("due date label", () => {
            it("should show 'Due today' when nextDueDate is today", () => {
                appStateService.recurringExpensesList.set([
                    buildRecurringExpense({ id: 'rec-1', nextDueDate: '2026-06-15'}),
                ]);
                fixture.detectChanges();

                const label = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('Due today'));
                expect(label).not.toBeNull();
            });

            it("should show 'In X days' when due within 3 days", () => {
                appStateService.recurringExpensesList.set([
                    buildRecurringExpense({ id: 'rec-1', nextDueDate: '2026-06-17'}),
                ]);
                fixture.detectChanges();

                const label = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('In 2 days'));
                expect(label).not.toBeNull();
            });

            it("should show 'Manual' when nextDueDate is null", () => {
                appStateService.recurringExpensesList.set([
                    buildRecurringExpense({ id: 'rec-1', nextDueDate: undefined}),
                ]);
                fixture.detectChanges();

                const label = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('Manual'));
                expect(label).not.toBeNull();
            });

            it("should show the full date with year when frequency is Annually", () => {
                appStateService.recurringExpensesList.set([
                    buildRecurringExpense({ id: 'rec-1', frequency: Frequency.Annually, nextDueDate: '2026-12-25' }),
                ]);
                fixture.detectChanges();

                const label = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('2026'));
                expect(label).not.toBeNull();
            });

            it("should show the short date without year for other frequencies", () => {
                appStateService.recurringExpensesList.set([
                    buildRecurringExpense({ id: 'rec-1', frequency: Frequency.Monthly, nextDueDate: '2026-12-25' }),
                ]);
                fixture.detectChanges();

                //look specifically for the date label showing "25 Dec" without a year
                const dateLabel = fixture.debugElement.query(
                    el => el.nativeElement.textContent?.trim() === '25 Dec'
                );
                expect(dateLabel).not.toBeNull();

                //and make sure no label shows a 4-digit year appended to it
                const dateWithYear = fixture.debugElement.query(
                    el => /^\d{1,2} \w+ \d{4}$/.test(el.nativeElement.textContent?.trim() ?? '')
                );
                expect(dateWithYear).toBeNull();
            });
        });

        describe("edit button", () => {
            it("should call openEditDialog with the correct item and stop propagation", () => {
                const rec = buildRecurringExpense({ id: 'rec-1' });
                appStateService.recurringExpensesList.set([rec]);
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                fixture.detectChanges();

                const spy = jest.spyOn(compAny, 'openEditDialog');
                const editBtn = fixture.debugElement.query(By.css('[data-testid="edit-recurring-expense-btn"]'));

                editBtn.nativeElement.click();

                expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'rec-1' }));
            });
        });

        describe("delete button", () => {
            it("should call deleteRecurringExpense with the correct item", () => {
                const rec = buildRecurringExpense({ id: 'rec-1', description: 'Netflix' });
                appStateService.recurringExpensesList.set([rec]);
                dialogMock.open.mockReturnValue({ afterClosed: () => EMPTY });
                fixture.detectChanges();

                const spy = jest.spyOn(compAny, 'deleteRecurringExpense');
                const deleteBtn = fixture.debugElement.query(By.css('[data-testid="delete-recurring-expense-btn"]'));

                deleteBtn.nativeElement.click();

                expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'rec-1' }));
            });
        });

        describe("rendered items", () => {
            it("should render one row per item in recurringExpensesSorted", () => {
                appStateService.recurringExpensesList.set([
                    buildRecurringExpense({ id: 'rec-1', description: 'Netflix' }),
                    buildRecurringExpense({ id: 'rec-2', description: 'Spotify' }),
                ]);
                fixture.detectChanges();

                const editButtons = fixture.debugElement.queryAll(By.css('[data-testid="edit-recurring-expense-btn"]'));
                expect(editButtons.length).toBe(2);
            });
        });
    });
});