using System;

namespace ExpenseTracker.Domain.Entities;

public class Budget
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }

    //Navigation Property
    public Guid UserId { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}
