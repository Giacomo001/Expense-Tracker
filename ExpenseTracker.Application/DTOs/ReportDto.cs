using System;

namespace ExpenseTracker.Application.DTOs;

public record ExpenseByCategory
(
    string CategoryName,
    decimal TotalAmount
);

public record ExpenseByMonth
(
    int Year,
    int Month,
    decimal TotalAmount
);

public record ReportDto
(
    IReadOnlyList<ExpenseByCategory> ExpensesByCategory,
    IReadOnlyList<ExpenseByMonth> ExpensesByMonth,
    DateOnly From,
    DateOnly To,
    decimal GrandTotal
);