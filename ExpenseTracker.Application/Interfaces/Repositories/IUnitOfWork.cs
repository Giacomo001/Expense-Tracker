using System;

namespace ExpenseTracker.Application.Interfaces.Repositories;

public interface IUnitOfWork
{
    IBudgetRepository Budgets { get; }
    ICategoryRepository Categories { get; }
    IExpenseRepository Expenses { get; }
    IRefreshTokenRepository Tokens { get; }
    Task<bool> Complete(CancellationToken token);
}
