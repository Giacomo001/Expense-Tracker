namespace ExpenseTracker.Application.DTOs;

public record BudgetReadDto(
    Guid Id,
    decimal Amount,
    Guid CategoryId,
    string CategoryName,
    string CategoryColor
);

public record BudgetCreateDto(
    decimal Amount,
    Guid CategoryId
);

public record BudgetUpdateDto(
    decimal? Amount
);