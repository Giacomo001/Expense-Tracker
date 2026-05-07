using System;
using System.Runtime.Intrinsics.Arm;
using System.Security.Cryptography;
using System.Text;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Interfaces.Services;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Infrastructure.Identity;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace ExpenseTracker.Infrastructure.Services;

public class AuthService(
    UserManager<User> userManager,
    IJwtService jwtService,
    IUnitOfWork uow,
    IConfiguration config,
    IValidator<RegisterDto> registerValidator,
    IValidator<LoginDto> loginValidator
) : IAuthService
{
    public async Task<ErrorOr<AuthResponseDto>> RegisterAsync(RegisterDto register, CancellationToken token = default)
    {
        var validationResult = await registerValidator.ValidateAsync(register, token);
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.ErrorCode, e.ErrorMessage))
                .ToList();
        }

        var existingUser = await userManager.FindByEmailAsync(register.Email);
        if(existingUser is not null) return Error.Conflict("Auth.Register", "Email already in use.");

        var user = new User
        {
            UserName = register.UserName,
            Email = register.Email,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, register.Password);
        if(!result.Succeeded)
        {
            return result.Errors
                .Select(e => Error.Validation(e.Code, e.Description))
                .ToList();
        }

        return await GenerateAuthResponseAsync(user, token);
    }

    public async Task<ErrorOr<AuthResponseDto>> LoginAsync(LoginDto login, CancellationToken token = default)
    {
        var validationResult = await loginValidator.ValidateAsync(login, token);
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.ErrorCode, e.ErrorMessage))
                .ToList();
        }

        var user = await userManager.FindByEmailAsync(login.Email);
        if(user is null) return Error.Unauthorized("Auth.Login", "Invalid credentials.");

        var passwordValid = await userManager.CheckPasswordAsync(user, login.Password);
        if(!passwordValid) return Error.Unauthorized("Auth.Login", "Invalid credentials.");

        return await GenerateAuthResponseAsync(user, token);
    }

    public async Task<ErrorOr<AuthResponseDto>> RefreshTokenAsync(string refreshToken, CancellationToken token = default)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

        var storedToken = await uow.Tokens.GetByTokenHashAsync(tokenHash, token);
        if(storedToken is null ||storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return Error.Unauthorized("Auth.RefreshToken", "Invalid or expired token.");
        }

        var user = await userManager.FindByIdAsync(storedToken.UserId.ToString());
        if(user is null) return Error.Unauthorized("Auth.RefreshToken", "User not found.");

        storedToken.IsRevoked = true;
        await uow.Complete(token);

        return await GenerateAuthResponseAsync(user, token);
    }

    public async Task<ErrorOr<Deleted>> RevokeTokenAsync(string refreshToken, CancellationToken token = default)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

        var storedToken = await uow.Tokens.GetByTokenHashAsync(tokenHash, token);
        if(storedToken is null) return Error.NotFound("Auth.RevokeToken", "Token not found.");

        storedToken.IsRevoked = true;
        if(!await uow.Complete(token))
        {
            return Error.Failure("Auth.RevokeToken", "There was a problem revoking the token.");
        }

        return Result.Deleted;    
    }

    //PRIVATE METHODS
    private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user, CancellationToken token)
    {
        var accessToken = jwtService.GenerateToken(user.Id, user.Email!, user.UserName!);
        var (refreshToken, refreshTokenHash) = jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            TokenHash = refreshTokenHash,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(config["Jwt__RefreshTokenExpirationDays"]!)),
            IsRevoked = false
        };

        await uow.Tokens.CreateToken(refreshTokenEntity, token);
        await uow.Complete(token);

        return new AuthResponseDto(accessToken, refreshToken, user.UserName!, user.Email!);
    }
}
