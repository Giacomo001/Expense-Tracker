using System;
using ErrorOr;
using ExpenseTracker.Application.Features.Expenses.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Expenses;

public class DeleteExpenseCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly DeleteExpenseHandler sut;

    public DeleteExpenseCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        sut = new DeleteExpenseHandler(uow);
    }

    [Fact]
    public async Task DeleteExpenseCommand_Should_ReturnNotFoundError_When_RecordDoesNotExist()
    {
        //Arrange
        var expenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns((Expense)null!);
        var command = new DeleteExpenseCommand(expenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("Expense.NotFound");
        result.FirstError.Description.Should().Be("The expense was not found");
        uow.Expenses.DidNotReceive().DeleteExpense(Arg.Any<Expense>());
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task DeleteExpenseCommand_Should_ReturnFailureError_When_DeleteUnsuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var entity = new Expense
        {
            Id = expenseId,
            Amount = 20.99m,
            Description = "Description Test",
            Date = DateOnly.FromDateTime(DateTime.Now),
            UserId = userId,
            CategoryId = categoryId
        };

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns(entity);
        var command = new DeleteExpenseCommand(expenseId, userId);
        uow.Complete(token).Returns(false);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("Expense.Failure");
        result.FirstError.Description.Should().Be("There has been a problem deleting the expense");
        uow.Expenses.Received(1).DeleteExpense(Arg.Any<Expense>());
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task DeleteExpenseCommand_Should_ReturnDeleted_When_DeleteSuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var entity = new Expense
        {
            Id = expenseId,
            Amount = 20.99m,
            Description = "Description Test",
            Date = DateOnly.FromDateTime(DateTime.Now),
            UserId = userId,
            CategoryId = categoryId
        };

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns(entity);
        var command = new DeleteExpenseCommand(expenseId, userId);
        uow.Complete(token).Returns(true);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Deleted);
        uow.Expenses.Received(1).DeleteExpense(Arg.Any<Expense>());
        await uow.Received(1).Complete(token);
    }
}
