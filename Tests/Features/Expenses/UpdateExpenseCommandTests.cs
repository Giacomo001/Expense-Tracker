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

public class UpdateExpenseCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly IValidator<ExpenseUpdateDto> updateValidator;
    private readonly UpdateExpenseHandler sut;

    public UpdateExpenseCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        updateValidator = Substitute.For<IValidator<ExpenseUpdateDto>>();
        sut = new UpdateExpenseHandler(uow, updateValidator);
    }

    [Fact]
    public async Task UpdateExpenseCommand_Should_ReturnValidationError_When_InputInvalid()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new ExpenseUpdateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        updateValidator.ValidateAsync(Arg.Any<ExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(new List<ValidationFailure>
            {
                new("Amount", "The amount cannot be lesser or equal than 0")
            }));

        var command = new UpdateExpenseCommand(dto, expenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task UpdateExpenseCommand_Should_ReturnNotFoundError_When_RecordDoesNotExist()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new ExpenseUpdateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        updateValidator.ValidateAsync(Arg.Any<ExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns((Expense)null!);
        var command = new UpdateExpenseCommand(dto, expenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("Expense.NotFound");
        result.FirstError.Description.Should().Be("The expense could not be found.");
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task UpdateExpenseCommand_Should_ReturnFailureError_When_UpdateUnsuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new ExpenseUpdateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        var entity = new Expense
        {
            Id = expenseId,
            Amount = 20.99m,
            Description = "Description Test",
            Date = DateOnly.FromDateTime(DateTime.Now),
            UserId = userId,
            CategoryId = categoryId
        };

        updateValidator.ValidateAsync(Arg.Any<ExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns(entity);
        var command = new UpdateExpenseCommand(dto, expenseId, userId);
        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("Expense.Failure");
        result.FirstError.Description.Should().Be("There has been a problem during the update of the expense.");
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task UpdateExpenseCommand_Should_ReturnExpenseReadDto_When_UpdateSuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new ExpenseUpdateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        var entity = new Expense
        {
            Id = expenseId,
            Amount = 20.99m,
            Description = "Description Test",
            Date = DateOnly.FromDateTime(DateTime.Now),
            UserId = userId,
            CategoryId = categoryId
        };

        updateValidator.ValidateAsync(Arg.Any<ExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns(entity);
        var command = new UpdateExpenseCommand(dto, expenseId, userId);
        uow.Complete(token).Returns(true);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Id.Should().Be(expenseId);
        result.Value.Description.Should().Be("Description Test");
        await uow.Received(1).Complete(token);
    }
}
