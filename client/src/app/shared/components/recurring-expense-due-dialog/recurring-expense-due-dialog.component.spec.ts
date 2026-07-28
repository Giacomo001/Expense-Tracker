import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RecurringExpenseDueDialogComponent, RecurringExpenseDueDialogData } from './recurring-expense-due-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { RecurringExpensesService } from "@features/recurring-expenses/services/recurring-expenses.service";
import { ToastService } from "@core/services/toast/toast.service";
import { AppStateService } from "@core/services/state/app-state.service";
import { RecurringExpenseDue } from "@features/recurring-expenses/models/recurring-expense.model";
import { ExpenseRead } from "@features/expenses/models/expense.model";
import { of } from "rxjs";

describe("RecurringExpenseDueDialogComponent", () => {
    let component: RecurringExpenseDueDialogComponent;
    let fixture: ComponentFixture<RecurringExpenseDueDialogComponent>;
    let appStateService: AppStateService;
    let compAny: any;

    const dialogRefMock = { close: jest.fn() };
    const recurringExpensesServiceMock = {
        confirmRecurringExpense: jest.fn(),
        skipRecurringExpense: jest.fn(),
        stopRecurringExpense: jest.fn(),
        getRecurringExpenseById: jest.fn(),
    };
    const toastServiceMock = { loading: jest.fn() };

    const buildDueExpense = (overrides: Partial<RecurringExpenseDue>): RecurringExpenseDue => ({
        id: 'rec-1',
        amount: 20,
        description: 'Netflix',
        categoryId: 'cat-1',
        categoryName: 'Food',
        categoryColor: '#ff0000',
        frequency: 'Monthly' as any,
        ...overrides
    });

    const buildExpenseRead = (overrides: Partial<ExpenseRead>): ExpenseRead => ({
        id: 'exp-new', amount: 20, description: 'Netflix', date: '2026-06-15' as unknown as Date,
        createdAt: '2026-06-15' as unknown as Date, categoryId: 'cat-1', categoryName: 'Food', categoryColor: '#ff0000',
        ...overrides
    });

    const setup = (data: RecurringExpenseDueDialogData) => {
        return TestBed.configureTestingModule({
            imports: [RecurringExpenseDueDialogComponent],
            providers: [
                AppStateService,
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: dialogRefMock },
                { provide: RecurringExpensesService, useValue: recurringExpensesServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
            ]
        }).compileComponents().then(() => {
            appStateService = TestBed.inject(AppStateService);
            fixture = TestBed.createComponent(RecurringExpenseDueDialogComponent);
            component = fixture.componentInstance;
            compAny = (component as any);
            fixture.detectChanges();
        });
    };

    beforeEach(() => {
        jest.resetAllMocks();
        //default: getRecurringExpenseById never called in most tests, but avoid "undefined.subscribe" crashes
        recurringExpensesServiceMock.getRecurringExpenseById.mockReturnValue(of({}));
    });

    // ================================================
    // form initialization
    // ================================================
    describe("form initialization", () => {
        it("should pre-fill amount/description from the first due expense", async () => {
            await setup({ dueExpenses: [buildDueExpense({ amount: 20, description: 'Netflix' })] });

            expect(compAny.confirmForm.value.amount).toBe(20);
            expect(compAny.confirmForm.value.description).toBe('Netflix');
        });

        it("should require a positive amount", async () => {
            await setup({ dueExpenses: [buildDueExpense({})] });

            compAny.confirmForm.get('amount')?.setValue(0);
            expect(compAny.confirmForm.get('amount')?.valid).toBe(false);
        });
    });

    // ================================================
    // currentExpense / isLast / totalCount
    // ================================================
    describe("navigation getters", () => {
        it("should expose totalCount as the number of due expenses", async () => {
            await setup({ dueExpenses: [buildDueExpense({ id: 'rec-1' }), buildDueExpense({ id: 'rec-2' })] });
            expect(compAny.totalCount).toBe(2);
        });

        it("should mark isLast=true when there is only one item", async () => {
            await setup({ dueExpenses: [buildDueExpense({ id: 'rec-1' })] });
            expect(compAny.isLast).toBe(true);
        });

        it("should mark isLast=false when there are more items after the current one", async () => {
            await setup({ dueExpenses: [buildDueExpense({ id: 'rec-1' }), buildDueExpense({ id: 'rec-2' })] });
            expect(compAny.isLast).toBe(false);
        });
    });

    // ================================================
    // confirm - two-step flow
    // ================================================
    describe("confirm (two-step flow)", () => {
        it("should confirm directly (no step 2) when neither amount nor description changed", async () => {
            await setup({ dueExpenses: [buildDueExpense({ amount: 20, description: 'Netflix' })] });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));

            compAny.confirm();

            expect(recurringExpensesServiceMock.confirmRecurringExpense).toHaveBeenCalledWith(
                'rec-1',
                expect.objectContaining({ updateTemplate: false })
            );
        });

        it("should show step 2 (showUpdateTemplateStep) when amount changed and NOT call the service yet", async () => {
            await setup({ dueExpenses: [buildDueExpense({ amount: 20 })] });
            compAny.confirmForm.get('amount')?.setValue(25);

            compAny.confirm();

            expect(compAny.showUpdateTemplateStep()).toBe(true);
            expect(recurringExpensesServiceMock.confirmRecurringExpense).not.toHaveBeenCalled();
        });

        it("should show step 2 when description changed", async () => {
            await setup({ dueExpenses: [buildDueExpense({ description: 'Netflix' })] });
            compAny.confirmForm.get('description')?.setValue('Netflix Premium');

            compAny.confirm();

            expect(compAny.showUpdateTemplateStep()).toBe(true);
        });

        it("should proceed to executeConfirm when confirm is called again after step 2 is shown", async () => {
            await setup({ dueExpenses: [buildDueExpense({ amount: 20 })] });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));
            compAny.confirmForm.get('amount')?.setValue(25);

            compAny.confirm(); //first call -> shows step 2
            compAny.confirm(); //second call -> proceeds (showUpdateTemplateStep is already true)

            expect(recurringExpensesServiceMock.confirmRecurringExpense).toHaveBeenCalledWith(
                'rec-1',
                expect.objectContaining({ updateTemplate: false })
            );
        });
    });

    describe("confirmWithTemplateUpdate", () => {
        it("should call confirmRecurringExpense with updateTemplate=true when confirmed", async () => {
            await setup({ dueExpenses: [buildDueExpense({})] });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));

            compAny.confirmWithTemplateUpdate(true);

            expect(recurringExpensesServiceMock.confirmRecurringExpense).toHaveBeenCalledWith(
                'rec-1',
                expect.objectContaining({ updateTemplate: true })
            );
        });

        it("should call confirmRecurringExpense with updateTemplate=false when 'only this time' is chosen", async () => {
            await setup({ dueExpenses: [buildDueExpense({})] });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));

            compAny.confirmWithTemplateUpdate(false);

            expect(recurringExpensesServiceMock.confirmRecurringExpense).toHaveBeenCalledWith(
                'rec-1',
                expect.objectContaining({ updateTemplate: false })
            );
        });
    });

    // ================================================
    // executeConfirm side effects
    // ================================================
    describe("executeConfirm side effects", () => {
        it("should append the new expense to expensesList", async () => {
            await setup({ dueExpenses: [buildDueExpense({})] });
            const newExpense = buildExpenseRead({ id: 'exp-new' });
            toastServiceMock.loading.mockReturnValue(of(newExpense));
            appStateService.expensesList.set([]);

            compAny.confirm();

            expect(appStateService.expensesList()).toEqual([newExpense]);
        });

        it("should remove the confirmed item from dueRecurringExpensesList", async () => {
            const due = buildDueExpense({ id: 'rec-1' });
            await setup({ dueExpenses: [due] });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));
            appStateService.dueRecurringExpensesList.set([due]);

            compAny.confirm();

            expect(appStateService.dueRecurringExpensesList()).toEqual([]);
        });

        it("should refresh the recurring expense in recurringExpensesList with the updated nextDueDate", async () => {
            await setup({ dueExpenses: [buildDueExpense({ id: 'rec-1' })] });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));
            const updatedRecurring = { id: 'rec-1', nextDueDate: '2026-08-01' } as any;
            recurringExpensesServiceMock.getRecurringExpenseById.mockReturnValue(of(updatedRecurring));
            appStateService.recurringExpensesList.set([{ id: 'rec-1', nextDueDate: '2026-07-01' } as any]);

            compAny.confirm();

            expect(appStateService.recurringExpensesList()).toEqual([updatedRecurring]);
        });

        it("should close the dialog when confirming the last (only) item", async () => {
            await setup({ dueExpenses: [buildDueExpense({ id: 'rec-1' })] });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));

            compAny.confirm();

            expect(dialogRefMock.close).toHaveBeenCalled();
        });

        it("should advance to the next item instead of closing when more items remain", async () => {
            await setup({
                dueExpenses: [
                    buildDueExpense({ id: 'rec-1', amount: 20 }),
                    buildDueExpense({ id: 'rec-2', amount: 30, description: 'Spotify' }),
                ]
            });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));

            compAny.confirm();

            expect(dialogRefMock.close).not.toHaveBeenCalled();
            expect(compAny.currentIndex()).toBe(1);
        });

        it("should reset the form with the next item's values after advancing", async () => {
            await setup({
                dueExpenses: [
                    buildDueExpense({ id: 'rec-1', amount: 20 }),
                    buildDueExpense({ id: 'rec-2', amount: 30, description: 'Spotify' }),
                ]
            });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));

            compAny.confirm();

            expect(compAny.confirmForm.value.amount).toBe(30);
            expect(compAny.confirmForm.value.description).toBe('Spotify');
        });

        it("should reset showUpdateTemplateStep to false when advancing to the next item", async () => {
            await setup({
                dueExpenses: [
                    buildDueExpense({ id: 'rec-1', amount: 20 }),
                    buildDueExpense({ id: 'rec-2', amount: 30 }),
                ]
            });
            toastServiceMock.loading.mockReturnValue(of(buildExpenseRead({})));
            compAny.confirmForm.get('amount')?.setValue(25); //triggers step 2
            compAny.confirm(); //shows step 2
            compAny.confirm(); //proceeds and advances to item 2

            expect(compAny.showUpdateTemplateStep()).toBe(false);
        });
    });

    // ================================================
    // skip
    // ================================================
    describe("skip", () => {
        it("should remove the item from dueRecurringExpensesList without touching expensesList", async () => {
            const due = buildDueExpense({ id: 'rec-1' });
            await setup({ dueExpenses: [due] });
            toastServiceMock.loading.mockReturnValue(of(undefined));
            appStateService.dueRecurringExpensesList.set([due]);
            appStateService.expensesList.set([]);

            compAny.skip();

            expect(appStateService.dueRecurringExpensesList()).toEqual([]);
            expect(appStateService.expensesList()).toEqual([]); //unchanged, unlike confirm()
        });

        it("should close the dialog when skipping the last item", async () => {
            await setup({ dueExpenses: [buildDueExpense({ id: 'rec-1' })] });
            toastServiceMock.loading.mockReturnValue(of(undefined));

            compAny.skip();

            expect(dialogRefMock.close).toHaveBeenCalled();
        });
    });

    // ================================================
    // stop
    // ================================================
    describe("stop", () => {
        it("should remove the item from dueRecurringExpensesList", async () => {
            const due = buildDueExpense({ id: 'rec-1' });
            await setup({ dueExpenses: [due] });
            toastServiceMock.loading.mockReturnValue(of(undefined));
            appStateService.dueRecurringExpensesList.set([due]);

            compAny.stop();

            expect(appStateService.dueRecurringExpensesList()).toEqual([]);
        });

        it("should set the recurring expense's frequency to Manual and clear nextDueDate", async () => {
            await setup({ dueExpenses: [buildDueExpense({ id: 'rec-1' })] });
            toastServiceMock.loading.mockReturnValue(of(undefined));
            appStateService.recurringExpensesList.set([{ id: 'rec-1', frequency: 'Monthly', nextDueDate: '2026-07-01' } as any]);

            compAny.stop();

            const updated = appStateService.recurringExpensesList()[0];
            expect(updated.frequency).toBe('Manual');
            expect(updated.nextDueDate).toBeUndefined();
        });

        it("should leave other recurring expenses in the list untouched", async () => {
            await setup({ dueExpenses: [buildDueExpense({ id: 'rec-1' })] });
            toastServiceMock.loading.mockReturnValue(of(undefined));
            const other = { id: 'rec-2', frequency: 'Monthly', nextDueDate: '2026-08-01' } as any;
            appStateService.recurringExpensesList.set([
                { id: 'rec-1', frequency: 'Monthly', nextDueDate: '2026-07-01' } as any,
                other
            ]);

            compAny.stop();

            expect(appStateService.recurringExpensesList()).toContainEqual(other);
        });
    });
});