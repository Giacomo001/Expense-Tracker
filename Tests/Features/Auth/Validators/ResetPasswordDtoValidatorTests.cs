using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Validators;
using FluentValidation.TestHelper;

namespace ExpenseTracker.Tests.Features.Auth.Validators;

public class ResetPasswordDtoValidatorTests
{
    private readonly ResetPasswordDtoValidator sut = new();
    private static ResetPasswordDto ValidDto() => new(
        Token: "dG9rZW4",
        Email: "john.doe@test.test",
        NewPassword: "Passw0rd!Passw0rd",
        ConfirmPassword: "Passw0rd!Passw0rd"
    );

    //THEORIES
    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void ResetPasswordDtoValidator_Should_HaveError_When_TokenIsEmpty(string tokenValue)
    {
        //Arrange
        var dto = ValidDto() with { Token = tokenValue };
        
        //Act
        var result = sut.TestValidate(dto);
        
        //Assert
        result.ShouldHaveValidationErrorFor(x => x.Token);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public void ResetPasswordDtoValidator_Should_HaveError_When_EmailIsEmptyOrInvalid(string email)
    {
        //Arrange
        var dto = ValidDto() with { Email = email };
        
        //Act
        var result = sut.TestValidate(dto);
        
        //Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    //FACTS
    [Fact]
    public void ResetPasswordDtoValidator_Should_NotHaveErrors_When_DtoIsValid()
    {
        //Arrange
        var dto = ValidDto();
        
        //Act
        var result = sut.TestValidate(dto);
        
        //Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ResetPasswordDtoValidator_Should_HaveError_When_NewPasswordIsEmpty()
    {
        //Arrange
        var dto = ValidDto() with { NewPassword = "", ConfirmPassword = "" };

        //Act
        var result = sut.TestValidate(dto);

        //Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword);
    }

    [Fact]
    public void ResetPasswordDtoValidator_Should_HaveError_When_PasswordsDoNotMatch()
    {
        //Arrange
        var dto = ValidDto() with { ConfirmPassword = "Different!Passw0rd1" };
        
        //Act
        var result = sut.TestValidate(dto);
        
        //Assert
        result.ShouldHaveValidationErrorFor(x => x.ConfirmPassword).WithErrorMessage("Passwords do not match.");
    }

    [Fact]
    public void ResetPasswordDtoValidator_Should_NotEnforcePasswordComplexity_When_PasswordIsWeak()
    {
        //Arrange
        var dto = ValidDto() with { NewPassword = "weak", ConfirmPassword = "weak" };
 
        //Act
        var result = sut.TestValidate(dto);
 
        //Assert
        result.ShouldNotHaveValidationErrorFor(x => x.NewPassword);
    }
}
