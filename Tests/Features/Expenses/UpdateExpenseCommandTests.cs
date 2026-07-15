using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Expenses.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Domain.Enums;
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

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns((Expense?)null);
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
            CategoryId = categoryId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Test",
                Color = "#000000",
                UserId = userId
            }
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
            CategoryId = categoryId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Test",
                Color = "#000000",
                UserId = userId
            }
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

    //Updating the RecurringExpense template
    [Fact]
    public async Task UpdateExpenseCommand_Should_UpdateRecurringExpense_When_ExpenseHasRecurringExpenseId()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var recurringExpenseId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new ExpenseUpdateDto
        (
            Amount: 17.99m,
            Description: "Gym updated",
            Date: null,
            CategoryId: null
        );

        var entity = new Expense
        {
            Id = expenseId,
            Amount = 24.99m,
            Description = "Grym",
            Date = DateOnly.FromDateTime(DateTime.Now),
            UserId = userId,
            CategoryId = categoryId,
            RecurringExpenseId = recurringExpenseId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var recurringExpense = new RecurringExpense
        {
            Id = recurringExpenseId,
            Amount = 24.99m,
            Description = "Grym",
            Frequency = Frequency.Monthly,
            NextDueDate = DateOnly.FromDateTime(DateTime.Today.AddMonths(1)),
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

        updateValidator.ValidateAsync(Arg.Any<ExpenseUpdateDto>(), Arg.Any<CancellationToken>()).Returns(new ValidationResult());

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns(entity);
        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recurringExpenseId, userId, token).Returns(recurringExpense);
        uow.Complete(token).Returns(true);

        var command = new UpdateExpenseCommand(dto, expenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        recurringExpense.Amount.Should().Be(17.99m); //Template Updated
        recurringExpense.Description.Should().Be("Gym updated"); //Template Updated
        await uow.RecurringExpenses.Received(1).GetRecurringExpenseByIdAsync(recurringExpenseId, userId, token);
        await uow.Received(1).Complete(token);
    } 

    [Fact]
    public async Task UpdateExpenseCommand_Should_NotUpdateRecurringExpense_When_ExpenseHasNoRecurringExpenseId()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new ExpenseUpdateDto
        (
            Amount: 17.99m,
            Description: "Updated",
            Date: null,
            CategoryId: null
        );

        var entity = new Expense
        {
            Id = expenseId,
            Amount = 24.99m,
            Description = "Original",
            Date = DateOnly.FromDateTime(DateTime.Now),
            UserId = userId,
            CategoryId = categoryId,
            RecurringExpenseId = null,  //No RecurringExpense linked to the Expense
            Category = new Category
            {
                Id = categoryId,
                Name = "Test",
                Color = "#000000",
                UserId = userId
            }
        };

        updateValidator.ValidateAsync(Arg.Any<ExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns(entity);
        uow.Complete(token).Returns(true);

        var command = new UpdateExpenseCommand(dto, expenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        await uow.RecurringExpenses.DidNotReceive().GetRecurringExpenseByIdAsync(Arg.Any<Guid>(), userId, token);
        await uow.Received(1).Complete(token);
    }
}
