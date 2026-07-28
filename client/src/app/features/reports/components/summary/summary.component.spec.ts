import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SummaryComponent } from './summary.component';
import { AppStateService } from "@core/services/state/app-state.service";
import { ExpenseRead } from "@features/expenses/models/expense.model";

describe("SummaryComponent", () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;
    let appStateService: AppStateService;

    let compAny: any;

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
            imports: [SummaryComponent],
            providers: [AppStateService]
        }).compileComponents();

        appStateService = TestBed.inject(AppStateService);

        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    // ================================================
    // last4Months - computed
    // ================================================
    describe("last4Months", () => {
        it("should return exactly 4 entries", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            expect(compAny.last4Months().length).toBe(4);
        });

        it("should return months in chronological order, ending at the current view month", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6); //June
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            const labels = compAny.last4Months().map((m: any) => m.label.toLowerCase());
            //expects March, April, May, June (in this order)
            expect(labels[3]).toContain('june');
            expect(labels[0]).toContain('march');
        });

        it("should roll back to the previous year when the range crosses January", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(2); //February -> range includes Nov/Dec 2025
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            const labels = compAny.last4Months().map((m: any) => m.label.toLowerCase());
            expect(labels[0]).toContain('2025');
            expect(labels[3]).toContain('2026');
        });

        it("should sum expenses correctly per month", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([
                buildExpense({ amount: 40, date: '2026-06-05' as unknown as Date }),
                buildExpense({ amount: 30, date: '2026-06-20' as unknown as Date }),
                buildExpense({ amount: 999, date: '2026-05-10' as unknown as Date }), //different month
            ]);
            fixture.detectChanges();

            const june = compAny.last4Months().at(-1);
            expect(june.total).toBe(70);
        });

        it("should set delta to null for the first (oldest) month", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            expect(compAny.last4Months()[0].delta).toBeNull();
        });

        it("should compute delta as current total minus previous month total", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([
                buildExpense({ amount: 100, date: '2026-05-10' as unknown as Date }), //May
                buildExpense({ amount: 150, date: '2026-06-10' as unknown as Date }), //June
            ]);
            fixture.detectChanges();

            const months = compAny.last4Months();
            const may = months[2];
            const june = months[3];

            expect(june.delta).toBe(june.total - may.total); //150 - 100 = 50
        });
    });

    // ================================================
    // maxTotal - computed
    // ================================================
    describe("maxTotal", () => {
        it("should return the highest total among the 4 months", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([
                buildExpense({ amount: 200, date: '2026-06-10' as unknown as Date }),
                buildExpense({ amount: 50, date: '2026-05-10' as unknown as Date }),
            ]);
            fixture.detectChanges();

            expect(compAny.maxTotal()).toBe(200);
        });

        it("should default to 1 when all totals are 0 (avoids division by zero)", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            expect(compAny.maxTotal()).toBe(1);
        });
    });

    // ================================================
    // barWidth - Method
    // ================================================
    describe("barWidth", () => {
        it("should return a percentage relative to maxTotal", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([
                buildExpense({ amount: 200, date: '2026-06-10' as unknown as Date }),
            ]);
            fixture.detectChanges();

            expect(compAny.barWidth(100)).toBe(50); //100/200 * 100
        });

        it("should return 0 when total is 0", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            expect(compAny.barWidth(0)).toBe(0);
        });
    });

    // ================================================
    // isDeltaPositive - Method
    // ================================================
    describe("isDeltaPositive", () => {
        it("should return true when delta is greater than 0", () => {
            expect(compAny.isDeltaPositive(10)).toBe(true);
        });

        it("should return false when delta is 0 or negative", () => {
            expect(compAny.isDeltaPositive(0)).toBe(false);
            expect(compAny.isDeltaPositive(-10)).toBe(false);
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
        it("should render one row per month in last4Months", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            const rows = fixture.debugElement.queryAll(el => el.nativeElement.classList?.contains('py-2'));
            expect(rows.length).toBe(4);
        });

        it("should show '—' for the first month (null delta)", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            const dash = fixture.debugElement.query(el => el.nativeElement.textContent?.trim() === '—');
            expect(dash).not.toBeNull();
        });

        it("should prefix positive delta with '+'", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([
                buildExpense({ amount: 100, date: '2026-05-10' as unknown as Date }),
                buildExpense({ amount: 150, date: '2026-06-10' as unknown as Date }),
            ]);
            fixture.detectChanges();

            const plus = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('+50'));
            expect(plus).not.toBeNull();
        });
    });
});