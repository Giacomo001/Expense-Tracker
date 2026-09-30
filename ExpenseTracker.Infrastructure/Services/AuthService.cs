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
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;

namespace ExpenseTracker.Infrastructure.Services;

public class AuthService(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
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

        //CheckLockedOut before attempting login
        if(await userManager.IsLockedOutAsync(user)) return Error.Forbidden("Auth.Login", "Account is temporarily locked. Please try again later.");

        //PasswordSignInAsync handles the lockout automatically after X login attempts by checking the password
        var result = await signInManager.CheckPasswordSignInAsync(user, login.Password, lockoutOnFailure: true);

        if (result.IsLockedOut) return Error.Forbidden("Auth.Login", "Account is temporarily locked. Please try again later.");

        if (!result.Succeeded) return Error.Unauthorized("Auth.Login", "Invalid credentials.");

        return await GenerateAuthResponseAsync(user, token);
    }

    public async Task<ErrorOr<AuthResponseDto>> RefreshTokenAsync(RefreshTokenDto dto, CancellationToken token = default)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(dto.RefreshToken)));

        var storedToken = await uow.Tokens.GetByTokenHashAsync(tokenHash, token);
        if(storedToken is null ||storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return Error.Unauthorized("Auth.RefreshToken", "Invalid or expired token.");
        }

        if(storedToken.IsRevoked)
        {
            //Check if an old - already rotated - token is reused
            //If it is, it revokes EVERY token from the User
            await uow.Tokens.RevokeAllByUserIdAsync(storedToken.UserId, token);
            await uow.Complete(token);
            return Error.Unauthorized("Auth.RefreshToken", "Token reuse detected. All sessions revoked.");
        }

        var user = await userManager.FindByIdAsync(storedToken.UserId.ToString());
        if(user is null) return Error.Unauthorized("Auth.RefreshToken", "User not found.");

        storedToken.IsRevoked = true;
        await uow.Complete(token);

        return await GenerateAuthResponseAsync(user, token);
    }

    public async Task<ErrorOr<Deleted>> RevokeTokenAsync(RefreshTokenDto dto, CancellationToken token = default)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(dto.RefreshToken)));

        var storedToken = await uow.Tokens.GetByTokenHashAsync(tokenHash, token);
        if(storedToken is null) return Error.NotFound("Auth.RevokeToken", "Token not found.");

        storedToken.IsRevoked = true;
        if(!await uow.Complete(token))
        {
            return Error.Failure("Auth.RevokeToken", "There was a problem revoking the token.");
        }

        return Result.Deleted;    
    }

    public async Task<string?> GeneratePasswordResetLinkAsync(ForgotPasswordDto dto, CancellationToken token = default)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);

        if(user is null)
        {
            return null;
        }

        var rawToken = await userManager.GeneratePasswordResetTokenAsync(user);
        //Trasforms the rawToken in a Base64 URL-Safe string (avoids problematic special characters such as '+', '/' or '=')
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(rawToken));

        var frontendBaseUrl = config["Frontend:BaseUrl"] ?? 
            throw new InvalidOperationException("Frontend:BaseUrl is not configured");

        return $"{frontendBaseUrl}/auth/reset-password?token={encodedToken}&email={Uri.EscapeDataString(user.Email!)}";
    }

    public async Task<ErrorOr<Success>> ResetPasswordAsync(ResetPasswordDto dto, CancellationToken token = default)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);

        if(user is null)
        {
            return Error.Validation("ResetPassword.InvalidToken", "Invalid or expired token.");
        }

        //Token part
        string decodedToken;

        try
        {
            decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(dto.Token));
        } 
        catch(FormatException)
        {
            return Error.Validation("ResetPassword.InvalidToken", "Invalid or expired token.");
        }

        var result = await userManager.ResetPasswordAsync(user, decodedToken, dto.NewPassword);

        if (!result.Succeeded)
        {
            var errorMessage = result.Errors.FirstOrDefault()?.Description ?? "Invalid or expired token.";
            return Error.Validation("ResetPassword.Failed", errorMessage);
        }

        return Result.Success;
    }

    //PRIVATE METHODS
    private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user, CancellationToken token)
    {
        //Both the AccessToken and the RefreshToken are generated here
        var accessToken = jwtService.GenerateToken(user.Id, user.Email!, user.UserName!);
        var (refreshToken, refreshTokenHash) = jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            TokenHash = refreshTokenHash,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(config["Jwt:RefreshTokenExpirationDays"]!)),
            IsRevoked = false
        };

        await uow.Tokens.CreateToken(refreshTokenEntity, token);
        await uow.Complete(token);

        return new AuthResponseDto(accessToken, refreshToken, user.UserName!, user.Email!);
    }
}
