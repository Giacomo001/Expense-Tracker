using ExpenseTracker.Application.Features.RecurringExpenses.Queries;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Utils;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Domain.Enums;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.RecurringExpenses;

public class GetRecurringExpenseByIdQueryTests
{
    private readonly IUnitOfWork uow;
    private readonly GetRecurringExpenseByIdHandler sut;

    public GetRecurringExpenseByIdQueryTests()
    {
        uow = Substitute.For<IUnitOfWork>();

        sut = new GetRecurringExpenseByIdHandler(uow);
    }

    [Fact]
    public async Task GetRecurringExpenseByIdHandler_Should_ReturnNotFound_When_RecordDoesNotExist()
    {
        //Arrange
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns((RecurringExpense?)null);
        var query = new GetRecurringExpenseByIdQuery(recExpenseId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("RecurringExpense.NotFound");
        result.FirstError.Description.Should().Be("Recurring expense was not found.");
    }

    [Fact]
    public async Task GetRecurringExpenseByIdHandler_Should_ReturnExpenseReadDto_When_RecordExists()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var recExpenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var nextDueDate = RecurrenceDateCalculatorService.Calculate(DateOnly.FromDateTime(DateTime.Today), Frequency.Weekly);

        var recurringExpense = new RecurringExpense
        {
            Id = recExpenseId,
            Amount = 20.99m, //'m' stands for a decimal number
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

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(recurringExpense);
        var query = new GetRecurringExpenseByIdQuery(recExpenseId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeFalse();
        
        //Singular fields are checked because 'CreatedAt' differs between the Dto and the Entity by some milliseconds
        result.Value.Id.Should().Be(recExpenseId);
        result.Value.Amount.Should().Be(20.99m);
        result.Value.NextDueDate.Should().Be(nextDueDate);
        result.Value.Frequency.Should().Be(Frequency.Weekly);
        result.Value.Description.Should().Be("Description Test");
        result.Value.CategoryId.Should().Be(categoryId);
        result.Value.CategoryName.Should().Be("Category Name Test");
    }
}