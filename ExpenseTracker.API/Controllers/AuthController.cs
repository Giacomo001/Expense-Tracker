using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.API.Controllers;

public class AuthController(IAuthService authService, IConfiguration config) : BaseApiController
{
    private const string RefreshTokenCookieName = "refreshToken";
    private const string RefreshTokenCookiePath = "/api/auth";

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken token)
    {
        var result = await authService.RegisterAsync(dto, token);

        return result.Match(
            authResponse => Ok(BuildClientResponse(authResponse)),
            errors => Problem(errors)
        );
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken token)
    {
        var result = await authService.LoginAsync(dto, token);

        return result.Match(
            authResponse => Ok(BuildClientResponse(authResponse)),
            errors => Problem(errors)
        );
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken token)
    {
        //out var => it makes sure the app won't crash if no cookie is found. It makes sure the TryGetValue will expect a refreshToken
        if(!Request.Cookies.TryGetValue(RefreshTokenCookieName, out var refreshToken) || string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized();
        }

        var result = await authService.RefreshTokenAsync(new RefreshTokenDto(refreshToken), token);

        return result.Match(
            authResponse => Ok(BuildClientResponse(authResponse)),
            errors => Problem(errors)
        );
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke(CancellationToken token)
    {
        if (Request.Cookies.TryGetValue(RefreshTokenCookieName, out var refreshToken) && !string.IsNullOrEmpty(refreshToken))
        {
            await authService.RevokeTokenAsync(new RefreshTokenDto(refreshToken), token);
        }

        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions { Path = RefreshTokenCookiePath });

        return NoContent();
    }

    //Private Methods
    //Methods to build what goes out from the backend
    private object BuildClientResponse(AuthResponseDto authResponseDto)
    {
        SetRefreshTokenCookie(authResponseDto.RefreshToken);

        //It returns the object that Angular needs to populate the signals
        return new { accessToken = authResponseDto.AccessToken, userName = authResponseDto.UserName, email = authResponseDto.Email };
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var expirationDays = int.Parse(config["Jwt:RefreshTokenExpirationDays"]!);

        Response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true, //FUNDAMENTAL to avoid XSS attacks
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = RefreshTokenCookiePath,
            Expires = DateTimeOffset.UtcNow.AddDays(expirationDays) 
        });
    }
}