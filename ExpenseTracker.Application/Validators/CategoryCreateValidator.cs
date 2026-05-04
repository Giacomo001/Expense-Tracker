using System;
using ExpenseTracker.Application.DTOs;
using FluentValidation;

namespace ExpenseTracker.Application.Validators;

public class CategoryCreateValidator : AbstractValidator<CategoryCreateDto>
{
    public CategoryCreateValidator()
    {
        RuleFor(c => c.Name)
            .NotEmpty().WithMessage("The category name cannot be empty.")
            .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.");
        
    }
}
