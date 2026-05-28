import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseRead } from '@features/expenses/models/expense.model';
import { buildCalendarDays, getFirstDayOfMonth, getMonthLabel, getNextMonth, getPreviousMonth, getTodayString, getTwoMonthsAhead, toDateString } from '@shared/utils/calendar.utils';

//Interface to optimize the construction of the calendar section
interface MonthData {
  year: number;
  month: number;
  label: string;
  calendarDays: { date: number; isToday: boolean; hasExpense: boolean }[];
  emptyCells: number[];
  total: number;
}

@Component({
  selector: 'app-calendar',
  imports: [MatIconModule, DecimalPipe, NgTemplateOutlet],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  // ============================================================
  // INJECT
  // ============================================================
  expensesList = input<ExpenseRead[]>([]);
  dateSelected = output<string>();
  
  // ============================================================
  // SIGNALS
  // ============================================================
  protected selectedDate = signal<string>(getTodayString());
  protected viewYear = signal(new Date().getFullYear());
  protected viewMonth = signal(new Date().getMonth() + 1);

  // ============================================================
  // COMPUTED
  // ============================================================
  protected viewMonthLabel = computed(() =>
    getMonthLabel(this.viewYear(), this.viewMonth())
  );

  //Builds month data generically — avoids code repetition
  private buildMonthData(year: number, month: number): MonthData {
    return {
      year,
      month,
      label: getMonthLabel(year, month),
      calendarDays: buildCalendarDays(year, month).map(day => ({
        ...day,
        hasExpense: this.expensesList().some(e =>
          e.date.toString().split('T')[0] === toDateString(year, month, day.date)
        )
      })),
      emptyCells: Array.from({ length: getFirstDayOfMonth(year, month) }, (_, i) => i),
      total: this.expensesList()
        .filter(e => {
          const [y, m] = e.date.toString().split('-').map(Number);
          return y === year && m === month;
        })
        .reduce((sum, e) => sum + e.amount, 0)
    };
  }

  protected prevMonthData = computed(() => {
    const prev = getPreviousMonth(this.viewYear(), this.viewMonth());
    return this.buildMonthData(prev.year, prev.month);
  });

  protected currentMonthData = computed(() =>
    this.buildMonthData(this.viewYear(), this.viewMonth())
  );

  protected nextMonthData = computed(() => {
    const next = getNextMonth(this.viewYear(), this.viewMonth());
    return this.buildMonthData(next.year, next.month);
  });

  protected nextTwoMonthData = computed(() => {
    const nextTwo = getTwoMonthsAhead(this.viewYear(), this.viewMonth());
    return this.buildMonthData(nextTwo.year, nextTwo.month);
  });

  // ============================================================
  // METHODS
  // ============================================================
  protected onDayClick(day: number, year: number, month: number) {
    const date = toDateString(year, month, day);
    this.selectedDate.set(date);
    this.dateSelected.emit(date);
    //Navigate calendar to clicked month if different from current view
    if (year !== this.viewYear() || month !== this.viewMonth()) {
      this.viewYear.set(year);
      this.viewMonth.set(month);
    }
  }

  protected isSelectedDay(day: number, year: number, month: number): boolean {
    return this.selectedDate() === toDateString(year, month, day);
  }

  protected goToPrevMonth() {
    const prev = getPreviousMonth(this.viewYear(), this.viewMonth());
    this.viewYear.set(prev.year);
    this.viewMonth.set(prev.month);
  }

  protected goToNextMonth() {
    const next = getNextMonth(this.viewYear(), this.viewMonth());
    this.viewYear.set(next.year);
    this.viewMonth.set(next.month);
  }
}
