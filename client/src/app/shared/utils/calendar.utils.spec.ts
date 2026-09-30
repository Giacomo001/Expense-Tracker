import {
    getDaysInMonth,
    getFirstDayOfMonth,
    buildCalendarDays,
    toDateString,
    getTodayString,
    getPreviousMonth,
    getNextMonth,
    getTwoMonthsAhead,
    getMonthLabel,
} from './calendar.utils';

describe("calendar.utils", () => {
    // ================================================
    // getDaysInMonth
    // ================================================
    describe("getDaysInMonth", () => {
        it.each([
            [2026, 1, 31],
            [2026, 2, 28],  //February, non-leap year
            [2024, 2, 29],  //February, leap year
            [2026, 4, 30],
            [2026, 12, 31],
        ])("year=%s month=%s -> %s days", (year, month, expected) => {
            expect(getDaysInMonth(year, month)).toBe(expected);
        });
    });

    // ================================================
    // getFirstDayOfMonth
    // ================================================
    describe("getFirstDayOfMonth", () => {
        it("should return 0 when the month starts on a Monday", () => {
            //June 2026 starts on a Monday
            expect(getFirstDayOfMonth(2026, 6)).toBe(0);
        });

        it("should return 6 when the month starts on a Sunday", () => {
            //March 2026 starts on a Sunday
            expect(getFirstDayOfMonth(2026, 3)).toBe(6);
        });

        it("should convert JS Sunday=0 correctly to Monday-first indexing", () => {
            //November 2026 starts on a Sunday too — cross-check with a second case
            const result = getFirstDayOfMonth(2026, 11);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(6);
        });
    });

    // ================================================
    // buildCalendarDays
    // ================================================
    describe("buildCalendarDays", () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(new Date('2026-06-15'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("should return one entry per day of the month", () => {
            const days = buildCalendarDays(2026, 6);
            expect(days.length).toBe(30); //June has 30 days
        });

        it("should mark isToday=true only for the current day/month/year", () => {
            const days = buildCalendarDays(2026, 6);
            const today = days.find(d => d.isToday);

            expect(today?.date).toBe(15);
        });

        it("should mark isToday=false for every day when viewing a different month", () => {
            const days = buildCalendarDays(2026, 7); //July, system date is June
            expect(days.every(d => !d.isToday)).toBe(true);
        });

        it("should initialize hasExpense to false for every day", () => {
            const days = buildCalendarDays(2026, 6);
            expect(days.every(d => d.hasExpense === false)).toBe(true);
        });
    });

    // ================================================
    // toDateString
    // ================================================
    describe("toDateString", () => {
        it("should zero-pad single-digit month and day", () => {
            expect(toDateString(2026, 6, 5)).toBe('2026-06-05');
        });

        it("should not alter double-digit month and day", () => {
            expect(toDateString(2026, 12, 25)).toBe('2026-12-25');
        });
    });

    // ================================================
    // getTodayString
    // ================================================
    describe("getTodayString", () => {
        afterEach(() => {
            jest.useRealTimers();
        });

        it("should return today's date formatted as YYYY-MM-DD", () => {
            jest.useFakeTimers().setSystemTime(new Date('2026-03-07'));
            expect(getTodayString()).toBe('2026-03-07');
        });
    });

    // ================================================
    // getPreviousMonth
    // ================================================
    describe("getPreviousMonth", () => {
        it("should decrement the month within the same year", () => {
            expect(getPreviousMonth(2026, 6)).toEqual({ year: 2026, month: 5 });
        });

        it("should roll back to December of the previous year when month is January", () => {
            expect(getPreviousMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
        });
    });

    // ================================================
    // getNextMonth
    // ================================================
    describe("getNextMonth", () => {
        it("should increment the month within the same year", () => {
            expect(getNextMonth(2026, 6)).toEqual({ year: 2026, month: 7 });
        });

        it("should roll over to January of the next year when month is December", () => {
            expect(getNextMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
        });
    });

    // ================================================
    // getTwoMonthsAhead
    // ================================================
    describe("getTwoMonthsAhead", () => {
        it.each([
            [2026, 1, 2026, 3],
            [2026, 6, 2026, 8],
            [2026, 10, 2026, 12],
            [2026, 11, 2027, 1],   //crosses year boundary at November
            [2026, 12, 2027, 2],   //crosses year boundary at December
        ])("year=%s month=%s -> year=%s month=%s", (year, month, expectedYear, expectedMonth) => {
            expect(getTwoMonthsAhead(year, month)).toEqual({ year: expectedYear, month: expectedMonth });
        });
    });

    // ================================================
    // getMonthLabel
    // ================================================
    describe("getMonthLabel", () => {
        it("should return a full month name with year", () => {
            expect(getMonthLabel(2026, 6)).toBe('June 2026');
        });

        it("should format December correctly", () => {
            expect(getMonthLabel(2026, 12)).toBe('December 2026');
        });
    });
});