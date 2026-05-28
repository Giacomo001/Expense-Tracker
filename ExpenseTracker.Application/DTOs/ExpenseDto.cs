using System;
using ExpenseTracker.Domain.Entities;

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
    Guid CategoryId
);

public record ExpenseUpdateDto(
    decimal? Amount,
    string? Description,
    DateOnly? Date,
    Guid? CategoryId
);