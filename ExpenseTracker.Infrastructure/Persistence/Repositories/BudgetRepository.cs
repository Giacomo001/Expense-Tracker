using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories;

public class BudgetRepository(AppDbContext context) : IBudgetRepository
{
    public async Task<IReadOnlyList<Budget>> GetAllBudgetsByUserIdAsync(Guid userId, CancellationToken token = default)
    {
        return await context.Budgets
            .Where(b => b.UserId == userId)
            .Include(b => b.Category)
            .OrderBy(b => b.Category.Name)
            .ToListAsync(token);
    }

    public async Task<Budget?> GetBudgetByIdAsync(Guid budgetId, Guid userId, CancellationToken token = default)
    {
        return await context.Budgets
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.UserId == userId, token);
    }

    public async Task<Budget?> GetBudgetByCategoryIdAsync(Guid categoryId, Guid userId, CancellationToken token = default)
    {
        return await context.Budgets
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.UserId == userId && b.CategoryId == categoryId, token);
    }

    public async Task CreateBudgetAsync(Budget budget, CancellationToken token = default)
    {
        await context.Budgets.AddAsync(budget, token);
    }

    public void DeleteBudget(Budget budget)
    {
        context.Budgets.Remove(budget);
    }
}