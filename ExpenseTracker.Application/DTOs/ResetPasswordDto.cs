using System;

namespace ExpenseTracker.Application.DTOs;

public record ResetPasswordDto
(
    string Token,
    string Email,
    string NewPassword,
    string ConfirmPassword
);
