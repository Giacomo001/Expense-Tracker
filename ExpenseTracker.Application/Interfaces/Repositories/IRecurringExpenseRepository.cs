using System;
using ExpenseTracker.Domain.Entities;

namespace ExpenseTracker.Application.Interfaces.Repositories;

public interface IRecurringExpenseRepository
{
    Task<IReadOnlyList<RecurringExpense>> GetAllRecurringExpensesByUserIdAsync(Guid userId, CancellationToken token = default);
    Task<IReadOnlyList<RecurringExpense>> GetDueRecurringExpensesByUserIdAsync(Guid userId, DateOnly today, CancellationToken token = default);
    Task<RecurringExpense?> GetRecurringExpenseByIdAsync(Guid recurringExpenseId, Guid userId, CancellationToken token = default);
    Task CreateRecurringExpenseAsync(RecurringExpense recurringExpense, CancellationToken token = default);
    void DeleteRecurringExpense(RecurringExpense recurringExpense);
}
