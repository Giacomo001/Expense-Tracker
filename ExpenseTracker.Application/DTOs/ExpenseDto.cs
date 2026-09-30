using System;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Domain.Enums;

namespace ExpenseTracker.Application.DTOs;

public record ExpenseReadDto(
    Guid Id,
    decimal Amount,
    string? Description,
    DateOnly Date,
    DateTime CreatedAt,
    Guid CategoryId,
    string CategoryName,
    string CategoryColor
);

public record ExpenseCreateDto(
    decimal Amount,
    string? Description,
    DateOnly Date,
    Guid CategoryId,
    Frequency Frequency = Frequency.Manual //The Frequency is decided in the Expense creation dialog
);

public record ExpenseUpdateDto(
    decimal? Amount,
    string? Description,
    DateOnly? Date,
    Guid? CategoryId
);