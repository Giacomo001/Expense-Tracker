using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ExpenseTracker.Application.Features.Auth.Commands;

public record ForgotPasswordCommand(ForgotPasswordDto Dto) : IRequest<ErrorOr<Success>>;

public class ForgotPasswordCommandHandler(
    IAuthService authService,
    IEmailService emailService,
    ILogger<ForgotPasswordCommandHandler> logger) : IRequestHandler<ForgotPasswordCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var resetLink = await authService.GeneratePasswordResetLinkAsync(request.Dto, cancellationToken);

        if (resetLink is null)
        {
            //The request is sent whether the email exists or not. It's a security procedure since the user shouldn't know if an email is present
            logger.LogInformation("Password reset requested for non-existent email");
            return Result.Success;
        }

        await emailService.SendPasswordResetEmailAsync(request.Dto.Email, resetLink, cancellationToken);

        return Result.Success;
    }
}