using System;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories;

public class CategoryRepository(AppDbContext context) : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> GetAllCategoriesByUserIdAsync(Guid userId, CancellationToken token = default)
    {
        return await context.Categories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .ToListAsync(token);
    }

    public async Task<Category?> GetCategoryByIdAsync(Guid categoryId, Guid userId, CancellationToken token = default)
    {
        return await context.Categories
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Id == categoryId, token);
    }

    public async Task CreateCategoryAsync(Category category, CancellationToken token = default)
    {
        await context.Categories.AddAsync(category, token);
    }
    
    public void DeleteCategory(Category category)
    {
        context.Categories.Remove(category);
    }
}
