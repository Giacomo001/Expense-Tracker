using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Expenses.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Expenses;

public class CreateExpenseCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly IValidator<ExpenseCreateDto> createValidator;
    private readonly CreateExpenseHandler sut;

    public CreateExpenseCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        createValidator = Substitute.For<IValidator<ExpenseCreateDto>>();
        sut = new CreateExpenseHandler(uow, createValidator);
    }

    [Fact]
    public async Task CreateExpenseCommand_Should_ReturnErrorList_When_InputIsInvalid()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var expenseCreate = new ExpenseCreateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        createValidator.ValidateAsync(Arg.Any<ExpenseCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(new List<ValidationFailure>
            {
                new("Amount", "Amount cannot be lesser or equal than 0")
            }));

        var command = new CreateExpenseCommand(expenseCreate, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        await uow.Expenses.DidNotReceive().CreateExpenseAsync(Arg.Any<Expense>(), token);
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task CreateExpenseCommand_Should_ReturnErrorFailure_When_CreationFailed()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        
        var expenseCreate = new ExpenseCreateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        createValidator.ValidateAsync(Arg.Any<ExpenseCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        var command = new CreateExpenseCommand(expenseCreate, userId);
        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        await uow.Expenses.Received(1).CreateExpenseAsync(Arg.Any<Expense>(), token);
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task CreateExpenseCommand_Should_ReturnExpenseReadDto_When_CreationSuccess()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var expenseCreate = new ExpenseCreateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        var expenseEntity = new Expense
        {
            Id = Guid.NewGuid(),
            Amount = 20.99m,
            Description = "Description Test",
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            UserId = userId,
            CategoryId = categoryId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Test",
                Color = "#000000",
                UserId = userId
            }
        };

        createValidator.ValidateAsync(Arg.Any<ExpenseCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Expenses.GetExpenseByIdAsync(Arg.Any<Guid>(), userId, token).Returns(expenseEntity);

        var command = new CreateExpenseCommand(expenseCreate, userId);
        uow.Complete(token).Returns(true);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Id.Should().NotBeEmpty();
        result.Value.Description.Should().Be("Description Test");
        await uow.Expenses.Received(1).CreateExpenseAsync(Arg.Any<Expense>(), token);
        await uow.Received(1).Complete(token);
    }
}
