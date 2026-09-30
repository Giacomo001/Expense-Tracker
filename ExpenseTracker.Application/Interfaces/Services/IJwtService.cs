using System;

namespace ExpenseTracker.Application.Interfaces.Services;

public interface IJwtService
{
    string GenerateToken(Guid userId, string email, string username);
    (string Token, string Hash) GenerateRefreshToken();
}
