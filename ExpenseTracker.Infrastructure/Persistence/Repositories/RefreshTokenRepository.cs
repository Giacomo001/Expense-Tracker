using System;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories;

public class RefreshTokenRepository(AppDbContext context) : IRefreshTokenRepository
{
    /// <summary>
    /// Method that compares the TokenHash with the Db records to return the User's one
    /// </summary>
    /// <param name="tokenHash">User's TokenHash</param>
    /// <param name="token">CancellationToken</param>
    /// <returns>Returns the RefreshToken if exists or NULL</returns>
    public async Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken token = default)
    {
        return await context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsRevoked, token);
    }

    public async Task CreateToken(RefreshToken refreshToken, CancellationToken token = default)
    {
        await context.RefreshTokens.AddAsync(refreshToken, token);
    }

    /// <summary>
    /// Method that revoke the User's RefreshToken setting 'IsRevoked' to TRUE
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="token"></param>
    /// <returns>Void method</returns>
    public async Task RevokeAllByUserIdAsync(Guid userId, CancellationToken token = default)
    {
        await context.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ExecuteUpdateAsync(t => t.SetProperty(rt => rt.IsRevoked, true), token);
    }
}
