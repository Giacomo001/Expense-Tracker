using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Services;
using MediatR;

namespace ExpenseTracker.Application.Features.Auth.Commands;

public record ResetPasswordCommand(ResetPasswordDto Dto) : IRequest<ErrorOr<Success>>;

public class ResetPasswordCommandHandler(IAuthService authService) : IRequestHandler<ResetPasswordCommand, ErrorOr<Success>>
{
    public Task<ErrorOr<Success>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
        => authService.ResetPasswordAsync(request.Dto, cancellationToken);
}