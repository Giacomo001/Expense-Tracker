using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Validators;
using FluentValidation.TestHelper;

namespace ExpenseTracker.Tests.Features.Auth.Validators;

public class ForgotPasswordDtoValidatorTests
{
    private readonly ForgotPasswordValidator sut = new();

    [Fact]
    public void ForgotPasswordDtoValidator_Should_NotHaveErrors_When_EmailIsValid()
    {
        //Arrange
        var dto = new ForgotPasswordDto("john.doe@test.test");
        
        //Act
        var result = sut.TestValidate(dto);
        
        //Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void ForgotPasswordDtoValidator_Should_HaveError_When_EmailIsEmpty(string email)
    {
        //Arrange
        var dto = new ForgotPasswordDto(email);
        
        //Act
        var result = sut.TestValidate(dto);
        
        //Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("@test.test")]
    public void ForgotPasswordDtoValidator_Should_HaveError_When_EmailIsInvalid(string email)
    {
        //Arrange
        var dto = new ForgotPasswordDto(email);
        
        //Act
        var result = sut.TestValidate(dto);
        
        //Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }
}
