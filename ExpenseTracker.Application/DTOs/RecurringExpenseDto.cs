using System;
using ExpenseTracker.Domain.Enums;

namespace ExpenseTracker.Application.DTOs;

public record RecurringExpenseReadDto
(
    Guid Id,
    decimal Amount,
    string? Description,
    Frequency Frequency,
    DateOnly? NextDueDate,
    Guid CategoryId,
    string CategoryName,
    string CategoryColor
);

public record RecurringExpenseDueDto
(
    Guid Id,
    decimal Amount,
    string? Description,
    Frequency Frequency,
    Guid CategoryId,
    string CategoryName,
    string CategoryColor
);

public record RecurringExpenseCreateDto
(
    decimal Amount,
    string? Description,
    Frequency Frequency,
    DateOnly StartDate,
    Guid CategoryId
);

public record RecurringExpenseUpdateDto
(
    decimal? Amount,
    string? Description
);