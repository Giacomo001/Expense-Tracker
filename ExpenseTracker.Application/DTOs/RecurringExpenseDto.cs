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

//Used to create a new instance of the entity 'RecurringExpense'
public record RecurringExpenseConfirmDto(
    decimal Amount,
    string? Description,
    bool UpdateTemplate //TRUE = the template is updated for every future instance, FALSE = amount/description changed for one instance only
);

public record RecurringExpenseUpdateDto
(
    decimal? Amount,
    string? Description,
    Frequency? Frequency
);