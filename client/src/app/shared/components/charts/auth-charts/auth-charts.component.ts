import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArcElement, Chart, ChartData, ChartOptions, DoughnutController, Tooltip } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(ArcElement, Tooltip, DoughnutController);

@Component({
  selector: 'app-auth-charts',
  imports: [BaseChartDirective],
  templateUrl: './auth-charts.component.html',
  styleUrl: './auth-charts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthChartsComponent {
  // ============================================================
  // INJECT
  // ============================================================
  
  // ============================================================
  // SIGNALS
  // ============================================================
  
  // ============================================================
  // COMPUTED
  // ============================================================
  
  // ============================================================
  // PROPERTIES
  // ============================================================
  
  // ============================================================
  // LIFE CYCLES
  // ============================================================
  
  // ============================================================
  // METHODS
  // ============================================================
  protected readonly donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  };

  protected readonly chartColors = ['#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#A78BFA'];

  protected readonly februaryData: ChartData<'doughnut'> = {
    labels: ['Food', 'Rent', 'Transport', 'Hobbies', 'Other'],
    datasets: [{
      data: [35, 28, 15, 12, 10],
      backgroundColor: this.chartColors,
      borderWidth: 0
    }]
  };

  protected readonly yearData: ChartData<'doughnut'> = {
    labels: ['Food', 'Rent', 'Transport', 'Hobbies', 'Other'],
    datasets: [{
      data: [30, 32, 18, 10, 10],
      backgroundColor: this.chartColors,
      borderWidth: 0
    }]
  };
}
