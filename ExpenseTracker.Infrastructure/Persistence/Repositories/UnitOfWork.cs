using System;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories;

public class UnitOfWork(
    AppDbContext context,
    ILogger<UnitOfWork> logger
    ) : IUnitOfWork
{
    public IBudgetRepository Budgets { get; } = new BudgetRepository(context);
    public ICategoryRepository Categories { get; } = new CategoryRepository(context);
    public IExpenseRepository Expenses { get; } = new ExpenseRepository(context);
    public IRefreshTokenRepository Tokens { get; } = new RefreshTokenRepository(context);

    public async Task<bool> Complete(CancellationToken token = default)
    {
        try { 
            var changes = await context.SaveChangesAsync(token); 
            logger.LogInformation("UnitOfWork completed. Changes saved: {Count}", changes); 
            return changes > 0; 
        } catch (Exception ex) 
        { 
            logger.LogError(ex, "Error while saving changes in UnitOfWork"); 
            throw; 
        }
    }
}
