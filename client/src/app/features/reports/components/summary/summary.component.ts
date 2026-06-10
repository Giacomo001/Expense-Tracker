import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AppStateService } from '@core/services/state/app-state.service';

interface MonthlySummary {
  label: string;
  total: number;
  delta: number | null;
}

@Component({
  selector: 'app-summary',
  imports: [DecimalPipe],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  // ============================================================
  // INJECT
  // ============================================================
  private appStateService = inject(AppStateService);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  
  // ============================================================
  // COMPUTED
  // ============================================================
  protected last4Months = computed<MonthlySummary[]>(() => {
    const expenses = this.appStateService.expensesList();
    const viewYear = this.appStateService.viewYear();
    const viewMonth = this.appStateService.viewMonth();

    //Generate the last 4 months from the old one to the recent one
    const months = Array.from({ length: 4 }, (_, i) => {
      const date = new Date(viewYear, viewMonth - 1 - i, 1);

      return {year: date.getFullYear(), month: date.getMonth() + 1};
    }).reverse();

    const totals = months.map(({ year, month }) => ({
      year,
      month,
      label: new Date(year, month - 1, 1)
        .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
      total: expenses
        .filter(e => {
          const [y, m] = e.date.toString().split('-').map(Number);
          return y === year && m === month;
        })
        .reduce((sum, e) => sum + e.amount, 0)
    }));

    //Instances of MonthlySummary are returned
    return totals.map((item, i) => ({
      label: item.label,
      total: item.total,
      delta: i === 0 ? null : item.total - totals[i - 1].total
    }));
  });

  protected maxTotal = computed(() => 
    Math.max(...this.last4Months().map(m => m.total), 1)
  );
  
  // ============================================================
  // PROPERTIES
  // ============================================================
  
  // ============================================================
  // LIFE CYCLES
  // ============================================================
  
  // ============================================================
  // METHODS
  // ============================================================
  protected barWidth(total: number): number {
    return Math.round((total / this.maxTotal()) * 100);
  }

  protected isDeltaPositive(delta: number): boolean {
    return delta > 0;
  }
}
