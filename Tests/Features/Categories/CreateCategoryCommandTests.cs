using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Categories.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Application.Validators;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Categories;

public class CreateCategoryCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly IValidator<CategoryCreateDto> createValidator;
    private readonly CreateCategoryHandler sut;

    public CreateCategoryCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        createValidator = Substitute.For<IValidator<CategoryCreateDto>>();
        sut = new CreateCategoryHandler(uow, createValidator);
    }

    [Fact]
    public async Task CreateCategoryCommand_Should_ReturnErrorList_When_InputIsInvalid()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        var categoryCreate = new CategoryCreateDto
        (
            Name: "Test"
        );

        createValidator.ValidateAsync(Arg.Any<CategoryCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(new List<ValidationFailure>
            {
                new("Name", "Name should not be empty")
            }));

        var command = new CreateCategoryCommand(categoryCreate, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        await uow.Categories.DidNotReceive().CreateCategoryAsync(Arg.Any<Category>(), token);
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task CreateCategoryCommand_Should_ReturnErrorFailure_When_CreationFailed()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        var categoryCreate = new CategoryCreateDto
        (
            Name: "Test"
        );

        createValidator.ValidateAsync(Arg.Any<CategoryCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        var command = new CreateCategoryCommand(categoryCreate, userId);
        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        await uow.Categories.Received(1).CreateCategoryAsync(Arg.Any<Category>(), token);
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task CreateCategoryCommand_Should_ReturnCategoryReadDto_When_CreationSuccess()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        var categoryCreate = new CategoryCreateDto
        (
            Name: "Test"
        );

        createValidator.ValidateAsync(Arg.Any<CategoryCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        var command = new CreateCategoryCommand(categoryCreate, userId);
        uow.Complete(token).Returns(true);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Id.Should().NotBeEmpty();
        result.Value.Name.Should().Be("Test");
        await uow.Categories.Received(1).CreateCategoryAsync(Arg.Any<Category>(), token);
        await uow.Received(1).Complete(token);
    }
}
