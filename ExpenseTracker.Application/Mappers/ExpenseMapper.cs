using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Domain.Entities;

namespace ExpenseTracker.Application.Mappers;

public static class ExpenseMapper
{
    public static ExpenseReadDto ExpenseToReadDto(this Expense expense)
    {
        return new ExpenseReadDto
        (
            Id: expense.Id,
            Amount: expense.Amount,
            Description: expense.Description,
            Date: expense.Date,
            CreatedAt: expense.CreatedAt,
            CategoryId: expense.CategoryId,
            CategoryName: expense.Category?.Name ?? string.Empty,
            CategoryColor: expense.Category?.Color ?? "#94A3B8"
        );
    }

    public static Expense ExpenseCreateToEntity(this ExpenseCreateDto expense, Guid userId)
    {
        return new Expense
        {
            Id = Guid.NewGuid(),
            Amount = expense.Amount,
            Description = expense.Description,
            Date = expense.Date,
            CategoryId = expense.CategoryId,
            UserId = userId
        };
    }

    public static void ExpenseUpdateEntity(this ExpenseUpdateDto expenseDto, Expense expense)
    {
        if(expenseDto.Amount.HasValue) expense.Amount = expenseDto.Amount.Value;
        if(expenseDto.Description is not null) expense.Description = expenseDto.Description;
        if(expenseDto.Date.HasValue) expense.Date = expenseDto.Date.Value;
        if(expenseDto.CategoryId is not null) expense.CategoryId = expenseDto.CategoryId.Value;
    }
}
