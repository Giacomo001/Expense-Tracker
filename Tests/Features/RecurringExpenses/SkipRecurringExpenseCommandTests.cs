using System;
using ErrorOr;
using ExpenseTracker.Application.Features.RecurringExpenses.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Utils;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Domain.Enums;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.RecurringExpenses;

public class SkipRecurringExpenseCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly SkipRecurringExpenseHandler sut;

    public SkipRecurringExpenseCommandTests() 
    {
        uow = Substitute.For<IUnitOfWork>();
        sut = new SkipRecurringExpenseHandler(uow);   
    }

    [Fact]
    public async Task SkipRecurringExpenseCommand_Should_ReturnNotFound_When_RecordDoesNotExist()
    {
        //Arrange
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns((RecurringExpense?)null);
        var query = new SkipRecurringExpenseCommand(recExpenseId, userId);

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
    public async Task SkipRecurringExpenseCommand_Should_ReturnErrorFailure_When_UpdateUnsuccessful()
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
            Frequency = Frequency.Weekly,
            CategoryId = categoryId,
            NextDueDate = DateOnly.FromDateTime(DateTime.Today),
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                UserId = userId
            }  
        };

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(recExpenseDb);
        var query = new SkipRecurringExpenseCommand(recExpenseId, userId);
        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("RecurringExpense.Failure");
        result.FirstError.Description.Should().Be("There has been a problem during the update of the recurring expense.");
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task SkipRecurringExpenseCommand_Should_Updated_When_UpdateSucceed()
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
            Description = "Description Test",
            UserId = userId,
            Frequency = Frequency.Weekly,
            CategoryId = categoryId,
            NextDueDate = nextDueDate,
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                UserId = userId
            }  
        };

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(recExpenseDb);
        var query = new SkipRecurringExpenseCommand(recExpenseId, userId);
        uow.Complete(token).Returns(true);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        //'Calculate' can be used withot mocking it since it's a static method that isn't tied to real data
        var expectedNextDueDate = RecurrenceDateCalculatorService.Calculate(nextDueDate, recExpenseDb.Frequency);

        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Updated);
        recExpenseDb.NextDueDate.Should().Be(expectedNextDueDate);
        await uow.Received(1).Complete(token);
    }
}
