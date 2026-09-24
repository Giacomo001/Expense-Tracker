using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using MediatR;

namespace ExpenseTracker.Application.Features.Auth.Commands;

public record ResetPasswordCommand(ResetPasswordDto Dto) : IRequest<ErrorOr<Success>>;