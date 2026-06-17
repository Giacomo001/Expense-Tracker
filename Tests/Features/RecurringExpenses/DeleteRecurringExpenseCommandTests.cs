using ErrorOr;
using ExpenseTracker.Application.Features.RecurringExpenses.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Domain.Enums;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.RecurringExpenses;

public class DeleteRecurringExpenseCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly DeleteRecurringExpenseHandler sut;

    public DeleteRecurringExpenseCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        sut = new DeleteRecurringExpenseHandler(uow);
    }

    [Fact]
    public async Task DeleteRecurringExpenseCommand_Should_ReturnNotFoundError_When_RecordDoesNotExist()
    {
        //Arrange
        var expenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(expenseId, userId, token).Returns((RecurringExpense?)null);
        var command = new DeleteRecurringExpenseCommand(expenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("RecurringExpense.NotFound");
        result.FirstError.Description.Should().Be("The recurring expense was not found");
        uow.RecurringExpenses.DidNotReceive().DeleteRecurringExpense(Arg.Any<RecurringExpense>());
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task DeleteRecurringExpenseCommand_Should_ReturnFailureError_When_DeleteUnsuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        var nextDueDate = DateOnly.FromDateTime(DateTime.Today);

        var entity = new RecurringExpense
        {
            Id = expenseId,
            Amount = 20.99m,
            Description = "Description Test",
            Frequency = Frequency.Weekly,
            NextDueDate = nextDueDate,
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

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(expenseId, userId, token).Returns(entity);
        var command = new DeleteRecurringExpenseCommand(expenseId, userId);
        uow.Complete(token).Returns(false);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("RecurringExpense.Failure");
        result.FirstError.Description.Should().Be("There has been a problem deleting the recurring expense");
        uow.RecurringExpenses.Received(1).DeleteRecurringExpense(Arg.Any<RecurringExpense>());
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task DeleteRecurringExpenseCommand_Should_ReturnDeleted_When_DeleteSuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        var nextDueDate = DateOnly.FromDateTime(DateTime.Today);

        var entity = new RecurringExpense
        {
            Id = expenseId,
            Amount = 20.99m,
            Description = "Description Test",
            Frequency = Frequency.Weekly,
            NextDueDate = nextDueDate,
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

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(expenseId, userId, token).Returns(entity);
        var command = new DeleteRecurringExpenseCommand(expenseId, userId);
        uow.Complete(token).Returns(true);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Deleted);
        uow.RecurringExpenses.Received(1).DeleteRecurringExpense(Arg.Any<RecurringExpense>());
        await uow.Received(1).Complete(token);
    }
}
