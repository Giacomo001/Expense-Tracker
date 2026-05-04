using System;

namespace ExpenseTracker.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    //Navigation Property
    public Guid UserId { get; set; }
}
