using ExpenseTracker.Domain.Entities;

namespace ExpenseTracker.Application.Interfaces.Repositories;

public interface IBudgetRepository
{
    Task<IReadOnlyList<Budget>> GetAllBudgetsByUserIdAsync(Guid userId, CancellationToken token = default);
    Task<Budget?> GetBudgetByIdAsync(Guid budgetId, Guid userId, CancellationToken token = default);
    Task<Budget?> GetBudgetByCategoryIdAsync(Guid categoryId, Guid userId, CancellationToken token = default);
    Task CreateBudgetAsync(Budget budget, CancellationToken token = default);
    void DeleteBudget(Budget budget);
}