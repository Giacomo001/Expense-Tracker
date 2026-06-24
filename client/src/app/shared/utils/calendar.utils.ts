//It makes sure the month has the right amount of days
export function getDaysInMonth(year: number, month: number): number {
  //Day 0 of next month = last day of current month
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  //Returns 0 (Sunday) to 6 (Saturday) — Monday is the first day
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function buildCalendarDays(year: number, month: number): { date: number; isToday: boolean; hasExpense: boolean }[] {
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);

  return Array.from({ length: daysInMonth }, (_, i) => ({
    date: i + 1,
    isToday: i + 1 === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear(),
    hasExpense: false
  }));
}

export function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getTodayString(): string {
  const today = new Date();
  return toDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

//Methods to get the previous and the next months
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  //If the current month is January, the previous month needs to be December of the previous year
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  //If the current month is December, the next month needs to be January of next year
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function getTwoMonthsAhead(year: number, month: number): { year: number; month: number } {
  return month == 12 ? { year: year + 1, month: 2 } : { year, month: month + 2 };
}

export function getMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}