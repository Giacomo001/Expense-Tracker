using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Domain.Enums;
using FluentValidation;

namespace ExpenseTracker.Application.Validators;

public class RecurringExpenseUpdateValidator : AbstractValidator<RecurringExpenseUpdateDto>
{
    public RecurringExpenseUpdateValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.")
            .When(x => x.Amount is not null);

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.Frequency)
            .Must(f => f != Frequency.Manual).WithMessage("Frequency cannot be set to Manual.")
            .When(x => x.Frequency.HasValue);
    }
}
