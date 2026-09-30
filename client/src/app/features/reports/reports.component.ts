import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppStateService } from '@core/services/state/app-state.service';
import { TabsComponent } from "@layout/tabs/tabs.component";
import { SummaryComponent } from "./components/summary/summary.component";
import { ReportChartComponent } from "./components/report-chart/report-chart.component";

@Component({
  selector: 'app-reports',
  imports: [TabsComponent, SummaryComponent, ReportChartComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
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
  
  // ============================================================
  // PROPERTIES
  // ============================================================
  protected currentMonthLabel = this.appStateService.currentMonthLabel;
  
  // ============================================================
  // LIFE CYCLES
  // ============================================================
  
  // ============================================================
  // METHODS
  // ============================================================
}
