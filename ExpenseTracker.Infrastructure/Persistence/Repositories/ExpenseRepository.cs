using System;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories;

public class ExpenseRepository(AppDbContext context) : IExpenseRepository
{
    public async Task<IReadOnlyList<Expense>> GetAllExpensesByUserIdAsync(Guid userId, CancellationToken token = default)
    {
        return await context.Expenses
            .Where(e => e.UserId == userId)
            .Include(e => e.Category)
            .OrderByDescending(e => e.Date)
            .ToListAsync(token);
    }

    public async Task<IReadOnlyList<Expense>> GetAllExpensesByUserIdWithCategoryAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken token = default)
    {
        return await context.Expenses
            .Where(e => e.UserId == userId && e.Date >= from && e.Date <= to)
            .Include(e => e.Category)
            .OrderByDescending(e => e.Date)
            .ToListAsync(token);
    }

    public async Task<Expense?> GetExpenseByIdAsync(Guid expenseId, Guid userId, CancellationToken token = default)
    {
        return await context.Expenses
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.Id == expenseId, token);
    }

    public async Task CreateExpenseAsync(Expense expense, CancellationToken token = default)
    {
        await context.Expenses.AddAsync(expense, token);
    }

    public void DeleteExpense(Expense expense)
    {
        context.Expenses.Remove(expense);
    }
}
