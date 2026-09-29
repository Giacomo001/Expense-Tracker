using System;
using Microsoft.Extensions.Logging;
using ExpenseTracker.Application.Features.Auth.Commands;
using ExpenseTracker.Application.Interfaces.Services;
using NSubstitute;
using ExpenseTracker.Application.DTOs;
using FluentAssertions;

namespace ExpenseTracker.Tests.Features.Auth;

public class ForgotPasswordCommandTests
{
    private readonly IAuthService authService;
    private readonly IEmailService emailService;
    private readonly ILogger<ForgotPasswordCommandHandler> logger;
    private readonly ForgotPasswordCommandHandler sut;

    public ForgotPasswordCommandTests()
    {
        authService = Substitute.For<IAuthService>();
        emailService = Substitute.For<IEmailService>();
        logger = Substitute.For<ILogger<ForgotPasswordCommandHandler>>();
        sut = new ForgotPasswordCommandHandler(authService, emailService, logger);
    }

    [Fact]
    public async Task ForgotPasswordCommand_Should_ReturnSuccessWithoutSendingMail_WhenMailDoesNotExist ()
    {
        //Arrange
        var token = CancellationToken.None;
        var dto = new ForgotPasswordDto("test@test.test");

        //AuthService returns null if the mail does not exist
        authService.GeneratePasswordResetLinkAsync(dto, token).Returns((string?)null);

        var command = new ForgotPasswordCommand(dto);
        
        //Act
        var result = await sut.Handle(command, token);
        
        //Assert
        //The outcome is IDENTICAL to the mail exists case for security purposes
        result.IsError.Should().BeFalse();
        await emailService.DidNotReceive().SendPasswordResetEmailAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ForgotPasswordCommand_Should_SendEmailWithGeneratedLink_WhenMailExists()
    {
        //Arrange
        var token = CancellationToken.None;
        var dto = new ForgotPasswordDto("john.doe@test.test");
        const string resetLink = "https://app.test/auth/reset-password?token=abc123&email=john.doe%40test.test";

        authService.GeneratePasswordResetLinkAsync(dto, token).Returns(resetLink);

        var command = new ForgotPasswordCommand(dto);
        
        //Act
        var result = await sut.Handle(command, token);
        
        //Assert
        result.IsError.Should().BeFalse();
        await emailService.Received(1).SendPasswordResetEmailAsync(dto.Email, resetLink, token);
    }
}
