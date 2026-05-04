using System;
using ExpenseTracker.Domain.Entities;

namespace ExpenseTracker.Application.Interfaces.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllCategoriesByUserIdAsync(Guid userId, CancellationToken token = default);
    Task<Category?> GetCategoryByIdAsync(Guid categoryId, Guid userId, CancellationToken token = default);
    Task CreateCategoryAsync(Category category, CancellationToken token = default);
    void UpdateCategory(Category category);
    void DeleteCategory(Category category);
}
