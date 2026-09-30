using ExpenseTracker.Application.DTOs;
using FluentValidation;

namespace ExpenseTracker.Application.Validators;

public class BudgetUpdateValidator : AbstractValidator<BudgetUpdateDto>
{
    public BudgetUpdateValidator()
    {
        RuleFor(x => x.Amount)
            .NotNull().WithMessage("The budget is required.")
            .GreaterThan(0).WithMessage("The budget amount must be greater than zero.");
    }
}