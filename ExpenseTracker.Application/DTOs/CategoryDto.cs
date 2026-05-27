using System;

namespace ExpenseTracker.Application.DTOs;

public record CategoryReadDto(
    Guid Id,
    string Name,
    string Color
);

public record CategoryCreateDto(
    string Name
);

public record CategoryUpdateDto(
    string? Name
);