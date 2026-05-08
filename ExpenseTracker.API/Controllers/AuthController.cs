using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.API.Controllers;

public class AuthController(IAuthService authService) : BaseApiController
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken token)
    {
        var result = await authService.RegisterAsync(dto, token);

        return result.Match(
            authResponse => Ok(authResponse),
            errors => Problem(errors)
        );
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken token)
    {
        var result = await authService.LoginAsync(dto, token);

        return result.Match(
            authResponse => Ok(authResponse),
            errors => Problem(errors)
        );
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken, CancellationToken token)
    {
        var result = await authService.RefreshTokenAsync(refreshToken, token);

        return result.Match(
            authResponse => Ok(authResponse),
            errors => Problem(errors)
        );
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] string refreshToken, CancellationToken token)
    {
        var result = await authService.RevokeTokenAsync(refreshToken, token);

        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
        );
    }
}