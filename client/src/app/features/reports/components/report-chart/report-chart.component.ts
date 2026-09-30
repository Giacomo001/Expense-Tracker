import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AppStateService } from '@core/services/state/app-state.service';
import { ReportsService } from '@features/reports/services/reports.service';
import { getDaysInMonth } from '@shared/utils/calendar.utils';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

//'as const' freezes the value as literal types instead of strings
const REPORT_VIEWS = ['monthly', 'annual', 'category'] as const;
//This depends on REPORT_VIEWS and it can only have a value taken among the values of that list
type ReportView = typeof REPORT_VIEWS[number];

@Component({
  selector: 'app-report-chart',
  imports: [BaseChartDirective, MatIconModule, TitleCasePipe, DecimalPipe],
  templateUrl: './report-chart.component.html',
  styleUrl: './report-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportChartComponent {
  // ============================================================
  // INJECT
  // ============================================================
  private appStateService = inject(AppStateService);
  private reportsService = inject(ReportsService);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected activeView = signal<ReportView>('monthly');
  
  // ============================================================
  // COMPUTED
  // ============================================================
  //KPI (Key Performance Indicator) management
  protected monthExpenses = computed(() => {
    const year = this.appStateService.viewYear();
    const month = this.appStateService.viewMonth();

    return this.appStateService.expensesList().filter(e => {
      const [y, m] = e.date.toString().split('-').map(Number);
      return y === year && m === month;
    });
  });

  protected grandTotal = computed(() =>
    this.monthExpenses().reduce((sum, e) => sum + e.amount, 0)
  );

  protected dailyAverage = computed(() => {
    const days = getDaysInMonth(this.appStateService.viewYear(), this.appStateService.viewMonth());
    return this.grandTotal() / days;
  });

  protected previousMonthTotal = computed(() => {
    const year = this.appStateService.viewYear();
    const month = this.appStateService.viewMonth();
    const prev = new Date(year, month - 2, 1);

    return this.appStateService.expensesList()
      .filter(e => {
        const [y, m] = e.date.toString().split('-').map(Number);
        return y === prev.getFullYear() && m === prev.getMonth() + 1;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  });

  protected deltaVsPrevious = computed(() => {
    const prev = this.previousMonthTotal();    
    if (prev === 0) return null;

    return ((this.grandTotal() - prev) / prev) * 100;
  });

  //Chart Data Management
  protected chartData = computed<ChartData<'bar'>>(() => {
    const view = this.activeView();

    if (view === 'monthly') return this.monthlyChartData();
    if (view === 'annual') return this.annualChartData();
    
    return this.categoryChartData();
  });

  //Monthly
  private monthlyChartData = computed<ChartData<'bar'>>(() => {
    const year = this.appStateService.viewYear();
    const month = this.appStateService.viewMonth();
    const days = getDaysInMonth(year, month);
    const expenses = this.monthExpenses();

    const data = Array.from({ length: days }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${day}`;
      return expenses
        .filter(e => e.date.toString().split('T')[0] === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
    });

    return {
      labels: Array.from({ length: days }, (_, i) => String(i + 1)),
      datasets: [{
        data,
        backgroundColor: 'var(--color-accent)',
        borderRadius: 3,
        borderSkipped: false,
      }]
    };
  });

  //Annual
  private annualChartData = computed<ChartData<'bar'>>(() => {
    const year = this.appStateService.viewYear();
    const expenses = this.appStateService.expensesList();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const data = Array.from({ length: 12 }, (_, i) =>
      expenses
        .filter(e => {
          const [y, m] = e.date.toString().split('-').map(Number);
          return y === year && m === i + 1;
        })
        .reduce((sum, e) => sum + e.amount, 0)
    );

    return {
      labels: months,
      datasets: [{
        data,
        backgroundColor: 'var(--color-accent)',
        borderRadius: 3,
        borderSkipped: false,
      }]
    };
  });

  //Category
  private categoryChartData = computed<ChartData<'bar'>>(() => {
    const expenses = this.monthExpenses();
    const categories = this.appStateService.categoriesList();

    const data = categories.map(cat =>
      expenses
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0)
    );

    return {
      labels: categories.map(c => c.name),
      datasets: [{
        data,
        backgroundColor: categories.map(c => c.color + '99'),
        borderRadius: 3,
        borderSkipped: false,
      }]
    };
  });

  //Options
  protected chartOptions = computed<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `€ ${ctx.parsed.y!.toFixed(2)}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          callback: val => `€ ${val}`
        }
      }
    }
  }));
  
  // ============================================================
  // PROPERTIES
  // ============================================================
  protected readonly views = REPORT_VIEWS;
  protected chart = viewChild(BaseChartDirective);
  
  // ============================================================
  // LIFE CYCLES
  // ============================================================
  
  // ============================================================
  // METHODS
  // ============================================================
  protected setView(view: ReportView): void {
    this.activeView.set(view);
  }

  protected exportPdf(): void {
    const chartImageBase64 = this.chart()?.toBase64Image()?.split(',')[1];

    this.reportsService.exportPdf({
      view: this.activeView(),
      year: this.appStateService.viewYear(),
      month: this.appStateService.viewMonth(),
      chartImageBase64
    }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${this.activeView()}-${this.appStateService.viewYear()}-${this.appStateService.viewMonth()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
