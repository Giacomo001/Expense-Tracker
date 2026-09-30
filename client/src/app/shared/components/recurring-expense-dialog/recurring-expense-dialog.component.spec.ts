import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RecurringExpenseDialogComponent, RecurringExpenseDialogData } from './recurring-expense-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { RecurringExpensesService } from "@features/recurring-expenses/services/recurring-expenses.service";
import { ToastService } from "@core/services/toast/toast.service";
import { RecurringExpenseRead } from "@features/recurring-expenses/models/recurring-expense.model";
import { CategoryRead } from "@features/categories/models/category.model";
import { Frequency } from "@features/recurring-expenses/models/frequency.enum";
import { of, throwError } from "rxjs";

describe("RecurringExpenseDialogComponent", () => {
    let component: RecurringExpenseDialogComponent;
    let fixture: ComponentFixture<RecurringExpenseDialogComponent>;
    let compAny: any;

    const dialogRefMock = { close: jest.fn() };
    const recurringExpensesServiceMock = { createRecurringExpense: jest.fn(), updateRecurringExpense: jest.fn() };
    const toastServiceMock = { loading: jest.fn(), error: jest.fn() };

    const mockCategories: CategoryRead[] = [{ id: 'cat-1', name: 'Food', color: '#ff0000' }];

    const mockRecurring: RecurringExpenseRead = {
        id: 'rec-1', amount: 20, description: 'Netflix', frequency: Frequency.Monthly,
        categoryId: 'cat-1', categoryName: 'Food', categoryColor: '#ff0000', nextDueDate: '2026-07-01'
    };

    const setup = (data: RecurringExpenseDialogData) => {
        return TestBed.configureTestingModule({
            imports: [RecurringExpenseDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: dialogRefMock },
                { provide: RecurringExpensesService, useValue: recurringExpensesServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(RecurringExpenseDialogComponent);
            component = fixture.componentInstance;
            compAny = (component as any);
            fixture.detectChanges();
        });
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    // ================================================
    // Mode detection / form shape
    // ================================================
    describe("create mode", () => {
        beforeEach(async () => {
            await setup({ recurringExpense: null, categories: mockCategories });
        });

        it("should include categoryId and startDate fields", () => {
            expect(compAny.recurringExpenseForm.get('categoryId')).not.toBeNull();
            expect(compAny.recurringExpenseForm.get('startDate')).not.toBeNull();
        });

        it("should default frequency to Monthly", () => {
            expect(compAny.recurringExpenseForm.value.frequency).toBe(Frequency.Monthly);
        });

        it("should default startDate to today", () => {
            const today = new Date().toISOString().split('T')[0];
            expect(compAny.recurringExpenseForm.value.startDate).toBe(today);
        });

        it("should exclude Manual from the selectable frequencies", () => {
            expect(compAny.frequencies).not.toContain(Frequency.Manual);
        });
    });

    describe("edit mode", () => {
        beforeEach(async () => {
            await setup({ recurringExpense: mockRecurring, categories: mockCategories });
        });

        it("should NOT include categoryId or startDate fields (not editable)", () => {
            expect(compAny.recurringExpenseForm.get('categoryId')).toBeNull();
            expect(compAny.recurringExpenseForm.get('startDate')).toBeNull();
        });

        it("should pre-fill amount, description and frequency", () => {
            expect(compAny.recurringExpenseForm.value.amount).toBe(20);
            expect(compAny.recurringExpenseForm.value.description).toBe('Netflix');
            expect(compAny.recurringExpenseForm.value.frequency).toBe(Frequency.Monthly);
        });
    });

    // ================================================
    // Form validators
    // ================================================
    describe("recurringExpenseForm validators (create mode)", () => {
        beforeEach(async () => {
            await setup({ recurringExpense: null, categories: mockCategories });
        });

        it.each([
            [null, false],
            [0, false],
            [0.01, true],
        ])("amount=%s -> valid=%s", (amount, expected) => {
            compAny.recurringExpenseForm.patchValue({ amount, categoryId: 'cat-1' });
            expect(compAny.recurringExpenseForm.get('amount')?.valid).toBe(expected);
        });

        it("should require categoryId", () => {
            compAny.recurringExpenseForm.patchValue({ categoryId: '' });
            expect(compAny.recurringExpenseForm.get('categoryId')?.hasError('required')).toBe(true);
        });

        it("should require startDate", () => {
            compAny.recurringExpenseForm.patchValue({ startDate: '' });
            expect(compAny.recurringExpenseForm.get('startDate')?.hasError('required')).toBe(true);
        });
    });

    // ================================================
    // save
    // ================================================
    describe("save (create mode)", () => {
        beforeEach(async () => {
            await setup({ recurringExpense: null, categories: mockCategories });
        });

        it("should show an error toast and not call the service when form is invalid", () => {
            compAny.recurringExpenseForm.patchValue({ amount: null, categoryId: '' });

            compAny.save();

            expect(toastServiceMock.error).toHaveBeenCalled();
            expect(recurringExpensesServiceMock.createRecurringExpense).not.toHaveBeenCalled();
        });

        it("should call createRecurringExpense with the full form payload", () => {
            toastServiceMock.loading.mockReturnValue(of(mockRecurring));
            compAny.recurringExpenseForm.patchValue({ amount: 20, categoryId: 'cat-1' });

            compAny.save();

            expect(recurringExpensesServiceMock.createRecurringExpense).toHaveBeenCalled();
            expect(recurringExpensesServiceMock.updateRecurringExpense).not.toHaveBeenCalled();
        });

        it("should close the dialog with the result on success", () => {
            toastServiceMock.loading.mockReturnValue(of(mockRecurring));
            compAny.recurringExpenseForm.patchValue({ amount: 20, categoryId: 'cat-1' });

            compAny.save();

            expect(dialogRefMock.close).toHaveBeenCalledWith(mockRecurring);
        });
    });

    describe("save (edit mode)", () => {
        beforeEach(async () => {
            await setup({ recurringExpense: mockRecurring, categories: mockCategories });
        });

        it("should call updateRecurringExpense with only amount/description/frequency", () => {
            toastServiceMock.loading.mockReturnValue(of(mockRecurring));
            compAny.recurringExpenseForm.patchValue({ amount: 25 });

            compAny.save();

            expect(recurringExpensesServiceMock.updateRecurringExpense).toHaveBeenCalledWith(
                'rec-1',
                expect.objectContaining({ amount: 25, description: 'Netflix', frequency: Frequency.Monthly })
            );
            //categoryId/startDate must NOT leak into the update payload, since the DTO doesn't support them
            const [, payload] = recurringExpensesServiceMock.updateRecurringExpense.mock.calls[0];
            expect(payload.categoryId).toBeUndefined();
            expect(payload.startDate).toBeUndefined();
        });
    });

    // ================================================
    // cancel
    // ================================================
    describe("cancel", () => {
        beforeEach(async () => {
            await setup({ recurringExpense: null, categories: mockCategories });
        });

        it("should close the dialog with null", () => {
            compAny.cancel();
            expect(dialogRefMock.close).toHaveBeenCalledWith(null);
        });
    });
});