using System;
using ExpenseTracker.Domain.Entities;

namespace ExpenseTracker.Application.Interfaces.Repositories;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken token = default);
    Task CreateToken(RefreshToken refreshToken, CancellationToken token = default);
    Task RevokeAllByUserIdAsync(Guid userId, CancellationToken token = default);
}
