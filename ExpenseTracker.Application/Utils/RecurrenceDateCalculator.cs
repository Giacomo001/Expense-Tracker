using System;
using ExpenseTracker.Domain.Enums;

namespace ExpenseTracker.Application.Utils;

public static class RecurrenceDateCalculatorService
{
    /// <summary>
    /// Calculates the next due date based on a starting date and the specified recurrence frequency.
    /// </summary>
    /// <param name="startingDate">The initial date from which the next date is calculated.</param>
    /// <param name="frequency">The recurrence frequency interval.</param>
    /// <returns>
    /// A <see cref="DateOnly"/> representing the next calculated date; 
    /// or <see langword="null"/> if the frequency is set to <see cref="Frequency.Manual"/>.
    /// </returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when an unsupported frequency value is provided.</exception>
    public static DateOnly? Calculate(DateOnly startingDate, Frequency frequency)
    {
        return frequency switch
        {
            Frequency.Weekly    => startingDate.AddDays(7),
            Frequency.Biweekly  => startingDate.AddDays(14),
            Frequency.Monthly   => startingDate.AddMonths(1),
            Frequency.Biannual  => startingDate.AddMonths(6),
            Frequency.Annually  => startingDate.AddYears(1),
            Frequency.Biennial  => startingDate.AddYears(2),
            Frequency.Manual    => null,
            _ => throw new ArgumentOutOfRangeException(nameof(frequency), frequency, "Unsupported frequency")
        };
    }
}
