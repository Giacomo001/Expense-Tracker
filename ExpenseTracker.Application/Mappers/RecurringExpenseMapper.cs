using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Utils;
using ExpenseTracker.Domain.Entities;

namespace ExpenseTracker.Application.Mappers;

public static class RecurringExpenseMapper
{
    public static RecurringExpenseReadDto RecurringExpenseToReadDto(this RecurringExpense expense)
    {
        return new RecurringExpenseReadDto
        (
            Id: expense.Id,
            Amount: expense.Amount,
            Description: expense.Description,
            Frequency: expense.Frequency,
            NextDueDate: expense.NextDueDate,
            CategoryId: expense.CategoryId,
            CategoryName: expense.Category?.Name ?? string.Empty,
            CategoryColor: expense.Category?.Color ?? "#94A3B8"
        );
    } 

    public static RecurringExpenseDueDto RecurringExpenseDueToReadDto(this RecurringExpense expense)
    {
        return new RecurringExpenseDueDto
        (
            Id: expense.Id,
            Amount: expense.Amount,
            Description: expense.Description,
            Frequency: expense.Frequency,
            CategoryId: expense.CategoryId,
            CategoryName: expense.Category?.Name ?? string.Empty,
            CategoryColor: expense.Category?.Color ?? "#94A3B8"
        );
    } 

    public static RecurringExpense RecurringExpenseCreateToEntity(this RecurringExpenseCreateDto dto, Guid userId, DateOnly? nextDueDate)
    {
        return new RecurringExpense
        {
            Id = Guid.NewGuid(),
            Amount = dto.Amount,
            Description = dto.Description,
            Frequency = dto.Frequency,
            NextDueDate = nextDueDate, //Calculated from StartDate using RecurrenceDateCalculatorService
            CategoryId = dto.CategoryId,
            UserId = userId
        };
    }

    public static void UpdateRecurringExpenseEntity(this RecurringExpenseUpdateDto dto, RecurringExpense entity)
    {
        if(dto.Amount.HasValue) entity.Amount = dto.Amount.Value;
        if(dto.Description is not null) entity.Description = dto.Description;
    }
}
