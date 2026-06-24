using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.RecurringExpenses.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Utils;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Domain.Enums;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.RecurringExpenses;

public class ConfirmRecurringExpenseCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly ConfirmRecurringExpenseHandler sut;

    public ConfirmRecurringExpenseCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        sut = new ConfirmRecurringExpenseHandler(uow);
    }

    [Fact]
    public async Task ConfirmRecurringExpenseCommand_Should_ReturnNotFound_When_RecordDoesNotExist()
    {
        //Arrange
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var recExpenseConfirm = new RecurringExpenseConfirmDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            UpdateTemplate: true
        );

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns((RecurringExpense?)null);
        var query = new ConfirmRecurringExpenseCommand(recExpenseConfirm, recExpenseId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorOr.ErrorType.NotFound);
        result.FirstError.Code.Should().Be("RecurringExpense.NotFound");
        result.FirstError.Description.Should().Be("Recurring expense was not found.");
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task ConfirmRecurringExpenseCommand_Should_ReturnFailure_When_UpdateUnsuccessful()
    {
        //Arrange
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var token = CancellationToken.None;

        var recExpenseDb = new RecurringExpense
        {
            Id = recExpenseId,
            Amount = 20.99m,
            Description = "Description Test",
            UserId = userId,
            Frequency = Frequency.Monthly,
            CategoryId = categoryId,
            NextDueDate = DateOnly.FromDateTime(DateTime.Today),
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var dto = new RecurringExpenseConfirmDto(
            Amount: 20.99m,
            Description: "Description Test",
            UpdateTemplate: false
        );

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(recExpenseDb);
        uow.Complete(token).Returns(false);

        var command = new ConfirmRecurringExpenseCommand(dto, recExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("RecurringExpense.Failure");
        result.FirstError.Description.Should().Be("An error occurred confirming the recurring expense.");
        await uow.Expenses.Received(1).CreateExpenseAsync(Arg.Any<Expense>(), token);
        await uow.Received(1).Complete(token);
        //This last check makes sure there was a rollback since Complete was not successful
        await uow.Expenses.DidNotReceive().GetExpenseByIdAsync(Arg.Any<Guid>(), userId, token);
    }

    [Fact]
    public async Task ConfirmRecurringExpenseCommand_Should_ReturnFailureRetrievingRecord_When_RecordWithCategoryDoesNotExist()
    {
        //Arrange
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var token = CancellationToken.None;

        var recExpenseDb = new RecurringExpense
        {
            Id = recExpenseId,
            Amount = 20.99m,
            Description = "Description Test",
            UserId = userId,
            Frequency = Frequency.Monthly,
            CategoryId = categoryId,
            NextDueDate = DateOnly.FromDateTime(DateTime.Today),
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var dto = new RecurringExpenseConfirmDto(
            Amount: 20.99m,
            Description: "Description Test",
            UpdateTemplate: false
        );

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(recExpenseDb);
        uow.Complete(token).Returns(true);
        //Reload fails, returns NULL
        uow.Expenses.GetExpenseByIdAsync(Arg.Any<Guid>(), userId, token).Returns((Expense?)null);

        var command = new ConfirmRecurringExpenseCommand(dto, recExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("RecurringExpense.Failure");
        result.FirstError.Description.Should().Be("An error occurred retrieving the confirmed expense.");
        await uow.Expenses.Received(1).CreateExpenseAsync(Arg.Any<Expense>(), token);
        await uow.Received(1).Complete(token);
        await uow.Expenses.Received(1).GetExpenseByIdAsync(Arg.Any<Guid>(), userId, token);
    }

    [Fact]
    public async Task ConfirmRecurringExpenseCommand_Should_ReturnExpenseReadDto_When_ConfirmSuccessful()
    {
        //Arrange
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var nextDueDate = DateOnly.FromDateTime(DateTime.Today);
        var token = CancellationToken.None;

        var recExpenseDb = new RecurringExpense
        {
            Id = recExpenseId,
            Amount = 20.99m,
            Description = "Description Test",
            UserId = userId,
            Frequency = Frequency.Monthly,
            CategoryId = categoryId,
            NextDueDate = nextDueDate,
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var expenseWithCategory = new Expense
        {
            Id = expenseId,
            Amount = 20.99m,
            Description = "Description Test",
            Date = nextDueDate,
            CategoryId = categoryId,
            UserId = userId,
            RecurringExpenseId = recExpenseId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var dto = new RecurringExpenseConfirmDto(
            Amount: 20.99m,
            Description: "Description Test",
            UpdateTemplate: false
        );

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(recExpenseDb);
        uow.Complete(token).Returns(true);
        uow.Expenses.GetExpenseByIdAsync(Arg.Any<Guid>(), userId, token).Returns(expenseWithCategory);

        var command = new ConfirmRecurringExpenseCommand(dto, recExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Amount.Should().Be(20.99m);
        result.Value.CategoryId.Should().Be(categoryId);
        recExpenseDb.NextDueDate.Should().Be(RecurrenceDateCalculatorService.Calculate(nextDueDate, Frequency.Monthly));
        await uow.Expenses.Received(1).CreateExpenseAsync(Arg.Any<Expense>(), token);
        await uow.Received(1).Complete(token);
        await uow.Expenses.Received(1).GetExpenseByIdAsync(Arg.Any<Guid>(), userId, token);
    }

    //Tests to check what happens if UpdateTemplate is TRUE or FALSE
    [Fact]
    public async Task ConfirmRecurringExpenseCommand_Should_NotUpdateTemplate_When_UpdateTemplateIsFalse()
    {
        //Arrange
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var nextDueDate = DateOnly.FromDateTime(DateTime.Today);
        var token = CancellationToken.None;

        var recExpenseDb = new RecurringExpense
        {
            Id = recExpenseId,
            Amount = 20.99m,
            Description = "Original Description",
            UserId = userId,
            Frequency = Frequency.Monthly,
            CategoryId = categoryId,
            NextDueDate = nextDueDate,
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var expenseWithCategory = new Expense
        {
            Id = Guid.NewGuid(),
            Amount = 17.99m,
            Description = "Modified Description",
            Date = nextDueDate,
            CategoryId = categoryId,
            UserId = userId,
            RecurringExpenseId = recExpenseId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var dto = new RecurringExpenseConfirmDto(
            Amount: 17.99m,
            Description: "Modified Description",
            UpdateTemplate: false  // ← it creates a SINGLE updated Expense
        );

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(recExpenseDb);
        uow.Complete(token).Returns(true);
        uow.Expenses.GetExpenseByIdAsync(Arg.Any<Guid>(), userId, token).Returns(expenseWithCategory);

        var command = new ConfirmRecurringExpenseCommand(dto, recExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Amount.Should().Be(17.99m); //The Expense has the new Amount
        result.Value.Description.Should().Be("Modified Description"); //The Expense has the new Description
        recExpenseDb.Amount.Should().Be(20.99m); //The Template stays the same as before the update
        recExpenseDb.Description.Should().Be("Original Description");
        recExpenseDb.NextDueDate.Should().Be(
            RecurrenceDateCalculatorService.Calculate(nextDueDate, Frequency.Monthly));
        await uow.Expenses.Received(1).CreateExpenseAsync(Arg.Any<Expense>(), token);
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task ConfirmRecurringExpenseCommand_Should_UpdateTemplate_When_UpdateTemplateIsTrue()
    {
        //Arrange
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var nextDueDate = DateOnly.FromDateTime(DateTime.Today);
        var token = CancellationToken.None;

        var recExpenseDb = new RecurringExpense
        {
            Id = recExpenseId,
            Amount = 20.99m,
            Description = "Original Description",
            UserId = userId,
            Frequency = Frequency.Monthly,
            CategoryId = categoryId,
            NextDueDate = nextDueDate,
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var expenseWithCategory = new Expense
        {
            Id = Guid.NewGuid(),
            Amount = 17.99m,
            Description = "Modified Description",
            Date = nextDueDate,
            CategoryId = categoryId,
            UserId = userId,
            RecurringExpenseId = recExpenseId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var dto = new RecurringExpenseConfirmDto(
            Amount: 17.99m,
            Description: "Modified Description",
            UpdateTemplate: true  // ← the template will be updated
        );

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(recExpenseDb);
        uow.Complete(token).Returns(true);
        uow.Expenses.GetExpenseByIdAsync(Arg.Any<Guid>(), userId, token).Returns(expenseWithCategory);

        var command = new ConfirmRecurringExpenseCommand(dto, recExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        //The Expense has the new Amount and Description
        result.Value.Amount.Should().Be(17.99m);
        result.Value.Description.Should().Be("Modified Description");
        //The Template has the new Amount and Description, future Expenses will too
        recExpenseDb.Amount.Should().Be(17.99m);
        recExpenseDb.Description.Should().Be("Modified Description");
        recExpenseDb.NextDueDate.Should().Be(RecurrenceDateCalculatorService.Calculate(nextDueDate, Frequency.Monthly));
        await uow.Expenses.Received(1).CreateExpenseAsync(Arg.Any<Expense>(), token);
        await uow.Received(1).Complete(token);
    }
}
