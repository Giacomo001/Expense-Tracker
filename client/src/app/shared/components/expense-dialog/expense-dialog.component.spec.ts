import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ExpenseDialogComponent, ExpenseDialogData } from './expense-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ExpensesService } from "@features/expenses/services/expenses.service";
import { ToastService } from "@core/services/toast/toast.service";
import { ExpenseRead } from "@features/expenses/models/expense.model";
import { CategoryRead } from "@features/categories/models/category.model";
import { Frequency } from "@features/recurring-expenses/models/frequency.enum";
import { of, throwError } from "rxjs";

describe("ExpenseDialogComponent", () => {
    let component: ExpenseDialogComponent;
    let fixture: ComponentFixture<ExpenseDialogComponent>;
    let compAny: any;

    const dialogRefMock = { close: jest.fn() };
    const expensesServiceMock = { createExpense: jest.fn(), updateExpense: jest.fn() };
    const toastServiceMock = { loading: jest.fn(), error: jest.fn() };

    const mockCategories: CategoryRead[] = [
        { id: 'cat-1', name: 'Food', color: '#ff0000' },
    ];

    const mockExpense: ExpenseRead = {
        id: 'exp-1', amount: 50, description: 'Groceries', date: '2026-06-10' as unknown as Date,
        createdAt: '2026-06-10' as unknown as Date, categoryId: 'cat-1', categoryName: 'Food', categoryColor: '#ff0000'
    };

    const setup = (data: ExpenseDialogData) => {
        return TestBed.configureTestingModule({
            imports: [ExpenseDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: dialogRefMock },
                { provide: ExpensesService, useValue: expensesServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(ExpenseDialogComponent);
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
    describe("create mode", () => {
        beforeEach(async () => {
            await setup({ expense: null, categories: mockCategories, selectedDate: '2026-06-15' });
        });

        it("should default date to selectedDate", () => {
            expect(compAny.expenseForm.value.date).toBe('2026-06-15');
        });

        it("should include the frequency field", () => {
            expect(compAny.expenseForm.get('frequency')).not.toBeNull();
        });

        it("should default frequency to Manual", () => {
            expect(compAny.expenseForm.value.frequency).toBe(Frequency.Manual);
        });
    });

    describe("edit mode", () => {
        beforeEach(async () => {
            await setup({ expense: mockExpense, categories: mockCategories, selectedDate: '2026-06-15' });
        });

        it("should pre-fill the form with the existing expense values", () => {
            expect(compAny.expenseForm.value.amount).toBe(50);
            expect(compAny.expenseForm.value.description).toBe('Groceries');
            expect(compAny.expenseForm.value.categoryId).toBe('cat-1');
        });

        it("should NOT include the frequency field (edit mode has no recurrence field)", () => {
            expect(compAny.expenseForm.get('frequency')).toBeNull();
        });
    });

    // ================================================
    // Form validators
    // ================================================
    describe("expenseForm validators", () => {
        beforeEach(async () => {
            await setup({ expense: null, categories: mockCategories, selectedDate: '2026-06-15' });
        });

        it.each([
            [null, false],
            [0, false],       //boundary: 0 must fail (min 0.01)
            [-10, false],
            [0.01, true],     //boundary: smallest valid amount
            [50, true],
        ])("amount=%s -> valid=%s", (amount, expected) => {
            compAny.expenseForm.patchValue({ amount, categoryId: 'cat-1' });
            expect(compAny.expenseForm.get('amount')?.valid).toBe(expected);
        });

        it("should require categoryId", () => {
            compAny.expenseForm.patchValue({ amount: 50, categoryId: '' });
            expect(compAny.expenseForm.get('categoryId')?.hasError('required')).toBe(true);
        });

        it("should require date", () => {
            compAny.expenseForm.patchValue({ date: '' });
            expect(compAny.expenseForm.get('date')?.hasError('required')).toBe(true);
        });

        it("should NOT require description (optional field)", () => {
            compAny.expenseForm.patchValue({ amount: 50, categoryId: 'cat-1', description: '' });
            expect(compAny.expenseForm.get('description')?.valid).toBe(true);
        });
    });

    // ================================================
    // save
    // ================================================
    describe("save", () => {
        beforeEach(async () => {
            await setup({ expense: null, categories: mockCategories, selectedDate: '2026-06-15' });
        });

        it("should show an error toast and not call the service when form is invalid", () => {
            compAny.expenseForm.patchValue({ amount: null });

            compAny.save();

            expect(toastServiceMock.error).toHaveBeenCalled();
            expect(expensesServiceMock.createExpense).not.toHaveBeenCalled();
        });

        it("should call createExpense in create mode", () => {
            toastServiceMock.loading.mockReturnValue(of(mockExpense));
            compAny.expenseForm.patchValue({ amount: 50, categoryId: 'cat-1' });

            compAny.save();

            expect(expensesServiceMock.createExpense).toHaveBeenCalled();
            expect(expensesServiceMock.updateExpense).not.toHaveBeenCalled();
        });

        it("should close the dialog with the result on success", () => {
            toastServiceMock.loading.mockReturnValue(of(mockExpense));
            compAny.expenseForm.patchValue({ amount: 50, categoryId: 'cat-1' });

            compAny.save();

            expect(dialogRefMock.close).toHaveBeenCalledWith(mockExpense);
        });

        it("should NOT close the dialog when the request errors out", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { title: 'Invalid data' } })));
            compAny.expenseForm.patchValue({ amount: 50, categoryId: 'cat-1' });

            compAny.save();

            expect(dialogRefMock.close).not.toHaveBeenCalled();
        });
    });

    describe("save (edit mode)", () => {
        beforeEach(async () => {
            await setup({ expense: mockExpense, categories: mockCategories, selectedDate: '2026-06-15' });
        });

        it("should call updateExpense with the expense id when in edit mode", () => {
            toastServiceMock.loading.mockReturnValue(of(mockExpense));

            compAny.save();

            expect(expensesServiceMock.updateExpense).toHaveBeenCalledWith('exp-1', expect.anything());
            expect(expensesServiceMock.createExpense).not.toHaveBeenCalled();
        });
    });

    // ================================================
    // cancel
    // ================================================
    describe("cancel", () => {
        beforeEach(async () => {
            await setup({ expense: null, categories: mockCategories, selectedDate: '2026-06-15' });
        });

        it("should close the dialog with null", () => {
            compAny.cancel();
            expect(dialogRefMock.close).toHaveBeenCalledWith(null);
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
        beforeEach(async () => {
            await setup({ expense: null, categories: mockCategories, selectedDate: '2026-06-15' });
        });

        it("should render the Frequency field in create mode", () => {
            const select = fixture.debugElement.query(el => el.nativeElement.getAttribute?.('formcontrolname') === 'frequency');
            expect(select).not.toBeNull();
        });

        it("should disable the save button when the form is invalid", () => {
            const btn = fixture.debugElement.query(el => el.nativeElement.textContent?.trim() === 'Create');
            expect(btn.nativeElement.disabled).toBe(true);
        });
    });
});