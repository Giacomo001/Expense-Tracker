using System;

namespace ExpenseTracker.Application.DTOs;

public record RegisterDto
(
    string UserName,
    string Email,
    string Password,
    string ConfirmPassword
);

public record LoginDto
(
    string Email,
    string Password
);

public record AuthResponseDto
(
    string AccessToken,
    string RefreshToken,
    string UserName,
    string Email
);