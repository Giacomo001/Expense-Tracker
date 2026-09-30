using System;

namespace ExpenseTracker.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty; //Hex color

    //Navigation Property
    public Guid UserId { get; set; }
}
