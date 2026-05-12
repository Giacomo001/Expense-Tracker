using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Categories.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Categories;

public class UpdateCategoryCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly IValidator<CategoryUpdateDto> updateValidator;
    private readonly UpdateCategoryHandler sut;

    public UpdateCategoryCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        updateValidator = Substitute.For<IValidator<CategoryUpdateDto>>();
        sut = new UpdateCategoryHandler(uow, updateValidator);
    }

    [Fact]
    public async Task UpdateCategoryCommand_Should_ReturnValidationError_When_InputInvalid()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new CategoryUpdateDto
        (
            Name: "Test"
        );

        updateValidator.ValidateAsync(Arg.Any<CategoryUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(new List<ValidationFailure>
            {
                new("Name", "The name cannot be empty")
            }));

        var command = new UpdateCategoryCommand(dto, categoryId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task UpdateCategoryCommand_Should_ReturnNotFoundError_When_RecordDoesNotExist()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new CategoryUpdateDto
        (
            Name: "Test"
        );

        updateValidator.ValidateAsync(Arg.Any<CategoryUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Categories.GetCategoryByIdAsync(categoryId, userId, token).Returns((Category)null!);
        var command = new UpdateCategoryCommand(dto, categoryId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("Category.NotFound");
        result.FirstError.Description.Should().Be("Category was not found");
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task UpdateCategoryCommand_Should_ReturnFailureError_When_UpdateUnsuccessful()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new CategoryUpdateDto
        (
            Name: "Test"
        );

        var entity = new Category
        {
            Id = categoryId,
            Name = "Test",
            UserId = userId
        };

        updateValidator.ValidateAsync(Arg.Any<CategoryUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Categories.GetCategoryByIdAsync(categoryId, userId, token).Returns(entity);
        var command = new UpdateCategoryCommand(dto, categoryId, userId);
        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("Category.Failure");
        result.FirstError.Description.Should().Be("The update was unsuccessful.");
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task UpdateCategoryCommand_Should_ReturnCategoryReadDto_When_UpdateSuccessful()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new CategoryUpdateDto
        (
            Name: "Test"
        );

        var entity = new Category
        {
            Id = categoryId,
            Name = "Test",
            UserId = userId
        };

        updateValidator.ValidateAsync(Arg.Any<CategoryUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Categories.GetCategoryByIdAsync(categoryId, userId, token).Returns(entity);
        var command = new UpdateCategoryCommand(dto, categoryId, userId);
        uow.Complete(token).Returns(true);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Id.Should().Be(categoryId);
        result.Value.Name.Should().Be("Test");
        await uow.Received(1).Complete(token);
    }
}
