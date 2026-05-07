using System;
using ExpenseTracker.Application.DTOs;
using FluentValidation;

namespace ExpenseTracker.Application.Validators;

public class RegisterValidator : AbstractValidator<RegisterDto>
{
    public RegisterValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty().WithMessage("The username cannot be empty.")
            .MaximumLength(50).WithMessage("The username should not exceed 100 characters");
        
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("The email is required.")
            .EmailAddress().WithMessage("The email is not valid.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(12).WithMessage("Password must be at least 12 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Passwords do not match.");
    }
}

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("The email is required.")
            .EmailAddress().WithMessage("Invalid email format.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("The password is required.");
    }
}


