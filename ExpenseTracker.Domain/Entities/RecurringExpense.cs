using System;
using ExpenseTracker.Domain.Enums;

namespace ExpenseTracker.Domain.Entities;

public class RecurringExpense
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public Frequency Frequency { get; set; } //The default value is 'Manual'
    public DateOnly? NextDueDate { get; set; }

    //Navigation Properties
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public Guid UserId { get; set; }
}
