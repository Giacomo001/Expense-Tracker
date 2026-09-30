using System;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories;

public class RecurringExpenseRepository(AppDbContext context) : IRecurringExpenseRepository
{
    //Used for the CRUD page
    public async Task<IReadOnlyList<RecurringExpense>> GetAllRecurringExpensesByUserIdAsync(Guid userId, CancellationToken token = default)
    {
        return await context.RecurringExpenses
            .Where(e => e.UserId == userId)
            .Include(e => e.Category)
            .OrderByDescending(e => e.NextDueDate)
            .ToListAsync(token);
    }

    //Get the expired RecurringExpenses
    public async Task<IReadOnlyList<RecurringExpense>> GetDueRecurringExpensesByUserIdAsync(Guid userId, DateOnly today, CancellationToken token = default)
    {
        return await context.RecurringExpenses
            .Where(e => e.UserId == userId 
                && e.NextDueDate != null 
                && e.NextDueDate <= today)
            .Include(e => e.Category)
            .OrderBy(e => e.NextDueDate)
            .ToListAsync(token);
    }

    public async Task<RecurringExpense?> GetRecurringExpenseByIdAsync(Guid recurringExpenseId, Guid userId, CancellationToken token = default)
    {
        return await context.RecurringExpenses
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.Id == recurringExpenseId, token);
    }

    public async Task CreateRecurringExpenseAsync(RecurringExpense recurringExpense, CancellationToken token = default)
    {
        await context.RecurringExpenses.AddAsync(recurringExpense, token);
    }

    public void DeleteRecurringExpense(RecurringExpense recurringExpense)
    {
        context.RecurringExpenses.Remove(recurringExpense);
    }
}
