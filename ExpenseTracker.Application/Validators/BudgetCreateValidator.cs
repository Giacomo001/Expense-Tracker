using ExpenseTracker.Application.DTOs;
using FluentValidation;

namespace ExpenseTracker.Application.Validators;

public class BudgetCreateValidator : AbstractValidator<BudgetCreateDto>
{
    public BudgetCreateValidator()
    {
        RuleFor(x => x.Amount)
            .NotNull().WithMessage("The budget is required.")
            .GreaterThan(0).WithMessage("The budget amount must be greater than zero.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("A category must be selected.");
    }
}