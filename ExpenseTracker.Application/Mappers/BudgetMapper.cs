using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Domain.Entities;

public static class BudgetMapper
{
    public static BudgetReadDto BudgetToReadDto(this Budget budget)
    {
        return new BudgetReadDto
        (
            Id: budget.Id,
            Amount: budget.Amount,
            CategoryId: budget.CategoryId,
            CategoryName: budget.Category.Name,
            CategoryColor: budget.Category.Color
        );
    }

    public static Budget BudgetCreateToEntity(this BudgetCreateDto budget, Guid userId)
    {
        return new Budget
        {
            Id = Guid.NewGuid(),
            Amount = budget.Amount,
            CategoryId = budget.CategoryId
        };
    }

    public static void BudgetUpdateEntity(this BudgetUpdateDto budgetDto, Budget budget)
    {
        if(budgetDto.Amount is not null) budget.Amount = budgetDto.Amount.Value;
    }
}
