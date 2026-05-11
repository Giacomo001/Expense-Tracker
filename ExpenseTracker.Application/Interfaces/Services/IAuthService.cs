using ErrorOr;
using ExpenseTracker.Application.DTOs;

namespace ExpenseTracker.Application.Interfaces.Services;

public interface IAuthService
{
    Task<ErrorOr<AuthResponseDto>> RegisterAsync(RegisterDto register, CancellationToken token = default);
    Task<ErrorOr<AuthResponseDto>> LoginAsync(LoginDto login, CancellationToken token = default);
    Task<ErrorOr<AuthResponseDto>> RefreshTokenAsync(RefreshTokenDto dto, CancellationToken token = default);
    Task<ErrorOr<Deleted>> RevokeTokenAsync(RefreshTokenDto dto, CancellationToken token = default);
}
