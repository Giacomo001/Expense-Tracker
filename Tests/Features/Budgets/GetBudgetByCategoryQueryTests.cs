using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Budgets.Queries;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Budgets;

public class GetBudgetByCategoryQuery
{
    private readonly IUnitOfWork uow;
    private readonly GetBudgetByCategoryIdHandler sut;

    public GetBudgetByCategoryQuery()
    {
        uow = Substitute.For<IUnitOfWork>();
        sut = new GetBudgetByCategoryIdHandler(uow);
    }

    [Fact]
    public async Task GetBudgetByCategoryIdAsync_Should_ReturnNotFound_When_RecordDoesNotExist()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.Budgets.GetBudgetByCategoryIdAsync(categoryId, userId, token).Returns((Budget?) null);
        var query = new GetBudgetByCategoryIdQuery(categoryId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Budget.NotFound");
        result.FirstError.Description.Should().Be("Budget could not be found.");
    }

    [Fact]
    public async Task GetBudgetByCategoryIdAsync_Should_ReturnBudgetReadDto_When_RecordExists()
    {
        //Arrange
        var budgetId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var token = CancellationToken.None;

        var budget = new Budget
        {
            Id = budgetId,
            Amount = 15m,
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

        var expectedResult = new BudgetReadDto
        (
            Id: budgetId,
            Amount: 15m,
            CategoryId: categoryId,
            CategoryName: "Test",
            CategoryColor: "#000000"
        );

        uow.Budgets.GetBudgetByCategoryIdAsync(categoryId, userId, token).Returns(budget);
        var query = new GetBudgetByCategoryIdQuery(categoryId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(expectedResult);
    }
}