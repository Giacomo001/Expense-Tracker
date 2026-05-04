using System;
using ExpenseTracker.Domain.Entities;

namespace ExpenseTracker.Application.Interfaces.Repositories;

public interface IExpenseRepository
{
    Task<IReadOnlyList<Expense>> GetAllExpensesByUserIdAsync(Guid userId, CancellationToken token = default);
    Task<Expense?> GetExpenseByIdAsync(Guid expenseId, Guid userId, CancellationToken token = default);
    Task CreateExpenseAsync(Expense expense, CancellationToken token = default);
    void UpdateExpense(Expense expense);
    void DeleteExpense(Expense expense);
}
