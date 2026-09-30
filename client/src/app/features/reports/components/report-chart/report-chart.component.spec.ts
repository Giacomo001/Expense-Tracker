import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReportChartComponent } from './report-chart.component';
import { AppStateService } from "@core/services/state/app-state.service";
import { ExpenseRead } from "@features/expenses/models/expense.model";
import { CategoryRead } from "@features/categories/models/category.model";
import { of } from "rxjs";
import { By } from "@angular/platform-browser";
import { ReportsService } from "@features/reports/services/reports.service";

describe("ReportChartComponent", () => {
    let component: ReportChartComponent;
    let fixture: ComponentFixture<ReportChartComponent>;
    let appStateService: AppStateService;

    let compAny: any;

    const reportsServiceMock = {
        exportPdf: jest.fn()
    };

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

    const mockCategories: CategoryRead[] = [
        { id: 'cat-1', name: 'Food', color: '#ff0000' },
        { id: 'cat-2', name: 'Rent', color: '#0000ff' }
    ];

    beforeAll(() => {
        //jsdom does not implement canvas rendering — ng2-charts calls getContext('2d') in its constructor, so without this mock the whole suite crashes at fixture creation.
        HTMLCanvasElement.prototype.getContext = jest.fn() as any;
    }); 

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [ReportChartComponent],
            providers: [
                AppStateService,
                { provide: ReportsService, useValue: reportsServiceMock },
            ]
        }).compileComponents();

        appStateService = TestBed.inject(AppStateService);

        fixture = TestBed.createComponent(ReportChartComponent);
        component = fixture.componentInstance;

        compAny = (component as any);

        appStateService.viewYear.set(2026);
        appStateService.viewMonth.set(6);
        fixture.detectChanges();
    });

    // ================================================
    // grandTotal / dailyAverage
    // ================================================
    describe("grandTotal", () => {
        it("should sum only the current month's expenses", () => {
            appStateService.expensesList.set([
                buildExpense({ amount: 40, date: '2026-06-05' as unknown as Date }),
                buildExpense({ amount: 30, date: '2026-06-20' as unknown as Date }),
                buildExpense({ amount: 999, date: '2026-05-15' as unknown as Date }),
            ]);
            fixture.detectChanges();

            expect(compAny.grandTotal()).toBe(70);
        });
    });

    describe("dailyAverage", () => {
        it("should divide grandTotal by the days in the current month", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(4); //April, 30 days
            appStateService.expensesList.set([
                buildExpense({ amount: 300, date: '2026-04-10' as unknown as Date }),
            ]);
            fixture.detectChanges();

            expect(compAny.dailyAverage()).toBe(10); //300/30
        });
    });

    // ================================================
    // previousMonthTotal - computed
    // ================================================
    describe("previousMonthTotal", () => {
        it("should sum expenses of the month before the current view month", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6); //June
            appStateService.expensesList.set([
                buildExpense({ amount: 100, date: '2026-05-15' as unknown as Date }), //May
                buildExpense({ amount: 999, date: '2026-06-15' as unknown as Date }), //June, excluded
            ]);
            fixture.detectChanges();

            expect(compAny.previousMonthTotal()).toBe(100);
        });

        it("should roll back to December of the previous year when the view month is January", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(1); //January -> previous is December 2025
            appStateService.expensesList.set([
                buildExpense({ amount: 200, date: '2025-12-20' as unknown as Date }),
            ]);
            fixture.detectChanges();

            expect(compAny.previousMonthTotal()).toBe(200);
        });
    });

    // ================================================
    // deltaVsPrevious - computed
    // ================================================
    describe("deltaVsPrevious", () => {
        it("should return null when previous month total is 0 (avoids division by zero)", () => {
            appStateService.expensesList.set([
                buildExpense({ amount: 100, date: '2026-06-15' as unknown as Date }),
            ]);
            fixture.detectChanges();

            expect(compAny.deltaVsPrevious()).toBeNull();
        });

        it("should return a positive percentage when spending increased", () => {
            appStateService.expensesList.set([
                buildExpense({ amount: 100, date: '2026-05-15' as unknown as Date }),
                buildExpense({ amount: 150, date: '2026-06-15' as unknown as Date }),
            ]);
            fixture.detectChanges();

            expect(compAny.deltaVsPrevious()).toBe(50); //(150-100)/100 * 100
        });

        it("should return a negative percentage when spending decreased", () => {
            appStateService.expensesList.set([
                buildExpense({ amount: 200, date: '2026-05-15' as unknown as Date }),
                buildExpense({ amount: 100, date: '2026-06-15' as unknown as Date }),
            ]);
            fixture.detectChanges();

            expect(compAny.deltaVsPrevious()).toBe(-50);
        });
    });

    // ================================================
    // setView / chartData - computed switching
    // ================================================
    describe("setView + chartData", () => {
        it("should default to 'monthly' view", () => {
            expect(compAny.activeView()).toBe('monthly');
        });

        it("should switch activeView when setView is called", () => {
            compAny.setView('annual');
            expect(compAny.activeView()).toBe('annual');
        });

        it("monthly view: should produce one data point per day of the month", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(4); //April, 30 days
            appStateService.expensesList.set([]);
            fixture.detectChanges();

            expect(compAny.chartData().labels.length).toBe(30);
        });

        it("monthly view: should place each expense on the correct day bucket", () => {
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.expensesList.set([
                buildExpense({ amount: 25, date: '2026-06-10' as unknown as Date }),
            ]);
            fixture.detectChanges();

            const data = compAny.chartData().datasets[0].data;
            expect(data[9]).toBe(25); //day 10 -> index 9
            expect(data[0]).toBe(0);
        });

        it("annual view: should produce 12 monthly totals for the selected year", () => {
            compAny.setView('annual');
            appStateService.viewYear.set(2026);
            appStateService.expensesList.set([
                buildExpense({ amount: 50, date: '2026-03-10' as unknown as Date }), //March
                buildExpense({ amount: 999, date: '2025-03-10' as unknown as Date }), //different year, excluded
            ]);
            fixture.detectChanges();

            const chart = compAny.chartData();
            expect(chart.labels.length).toBe(12);
            expect(chart.datasets[0].data[2]).toBe(50); //index 2 = March
        });

        it("category view: should produce one total per category", () => {
            compAny.setView('category');
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);
            appStateService.categoriesList.set(mockCategories);
            appStateService.expensesList.set([
                buildExpense({ amount: 40, categoryId: 'cat-1', date: '2026-06-10' as unknown as Date }),
                buildExpense({ amount: 60, categoryId: 'cat-2', date: '2026-06-15' as unknown as Date }),
            ]);
            fixture.detectChanges();

            const chart = compAny.chartData();
            expect(chart.labels).toEqual(['Food', 'Rent']);
            expect(chart.datasets[0].data).toEqual([40, 60]);
        });
    });

    // ================================================
    // exportPdf - Method
    // ================================================
    describe("exportPdf", () => {
        let createObjectURLSpy: jest.SpyInstance;
        let revokeObjectURLSpy: jest.SpyInstance;
        let clickSpy: jest.SpyInstance;

        beforeEach(() => {
            if (!URL.createObjectURL) {
                (URL as any).createObjectURL = jest.fn();
            }
            if (!URL.revokeObjectURL) {
                (URL as any).revokeObjectURL = jest.fn();
            }

            createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
            revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
            clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        });

        afterEach(() => {
            createObjectURLSpy.mockRestore();
            revokeObjectURLSpy.mockRestore();
            clickSpy.mockRestore();
        });

        it("should call ReportsService.exportPdf with the correct view/year/month", () => {
            reportsServiceMock.exportPdf.mockReturnValue(of(new Blob()));
            //no chart rendered -> chartImageBase64 will be undefined, that's fine for this test
            appStateService.viewYear.set(2026);
            appStateService.viewMonth.set(6);

            compAny.exportPdf();

            expect(reportsServiceMock.exportPdf).toHaveBeenCalledWith(
                expect.objectContaining({ view: 'monthly', year: 2026, month: 6 })
            );
        });

        it("should extract only the base64 payload (after the comma) from the chart image", () => {
            reportsServiceMock.exportPdf.mockReturnValue(of(new Blob()));
            jest.spyOn(compAny, 'chart').mockReturnValue({
                toBase64Image: () => 'data:image/png;base64,ABC123'
            });

            compAny.exportPdf();

            expect(reportsServiceMock.exportPdf).toHaveBeenCalledWith(
                expect.objectContaining({ chartImageBase64: 'ABC123' })
            );
        });

        it("should trigger a file download when the service responds", () => {
            reportsServiceMock.exportPdf.mockReturnValue(of(new Blob(['fake pdf'])));

            compAny.exportPdf();

            expect(createObjectURLSpy).toHaveBeenCalled();
            expect(clickSpy).toHaveBeenCalled();
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url');
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
        it("should call setView when a view button is clicked", () => {
            const spy = jest.spyOn(compAny, 'setView');
            fixture.detectChanges();

            const btn = fixture.debugElement.query(By.css('[data-testid="view-annual-btn"]'));
            btn.nativeElement.click();

            expect(spy).toHaveBeenCalledWith('annual');
        });

        it("should highlight the active view button", () => {
            compAny.setView('category');
            fixture.detectChanges();

            const activeBtn = fixture.debugElement.query(By.css('[data-testid="view-category-btn"]'));
            expect(activeBtn.nativeElement.className).toContain('bg-[var(--color-accent)]');
        });

        it("should call exportPdf when the export button is clicked", () => {
            reportsServiceMock.exportPdf.mockReturnValue(of(new Blob()));

            if (!URL.createObjectURL) (URL as any).createObjectURL = jest.fn();
            if (!URL.revokeObjectURL) (URL as any).revokeObjectURL = jest.fn();

            jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
            jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
            jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

            const spy = jest.spyOn(compAny, 'exportPdf');
            fixture.detectChanges();

            const btn = fixture.debugElement.query(By.css('[data-testid="export-pdf-btn"]'));
            btn.nativeElement.click();

            expect(spy).toHaveBeenCalled();
        });

        it("should not show the delta indicator when deltaVsPrevious is null", () => {
            appStateService.expensesList.set([
                buildExpense({ amount: 100, date: '2026-06-15' as unknown as Date }),
            ]);
            fixture.detectChanges();

            const delta = fixture.debugElement.query(By.css('[data-testid="delta-vs-previous"]'));
            expect(delta).toBeNull();
        });

        it("should show a positive delta with a '+' prefix", () => {
            appStateService.expensesList.set([
                buildExpense({ amount: 100, date: '2026-05-15' as unknown as Date }),
                buildExpense({ amount: 150, date: '2026-06-15' as unknown as Date }),
            ]);
            fixture.detectChanges();

            const delta = fixture.debugElement.query(By.css('[data-testid="delta-vs-previous"]'));
            expect(delta.nativeElement.textContent).toContain('+50');
        });
    });
});