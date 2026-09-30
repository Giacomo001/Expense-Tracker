using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Reports.Queries;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Reports;

public class GetExpensesSummaryQueryTests
{
    private readonly IUnitOfWork uow;
    private readonly GetExpensesSummaryHandler sut;

    public GetExpensesSummaryQueryTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        sut = new GetExpensesSummaryHandler(uow);
    }

    [Fact]
    public async Task GetExpensesSummary_Should_ReturnValidationError_When_FromIsAfterTo()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var to = DateOnly.FromDateTime(DateTime.UtcNow);
        var from = to.AddDays(5); //From being 5 days more than To triggers the Validation Error
        var token = CancellationToken.None;

        var query = new GetExpensesSummaryQuery(userId, from, to);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Report.DataRange");
        result.FirstError.Description.Should().Be("'From' date must be before the 'To' date.");
    }

    [Fact]
    public async Task GetExpensesSummary_Should_ReturnReportDto_When_ExpensesExist()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var from = DateOnly.FromDateTime(DateTime.UtcNow);
        var to = from.AddDays(5);
        var token = CancellationToken.None;

        uow.Expenses.GetAllExpensesByUserIdWithCategoryAsync(userId, from, to, token)
            .Returns([
                new()
                {
                    Id = Guid.NewGuid(),
                    Amount = 10,
                    Description = "Food Test",
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    UserId = userId,
                    CategoryId = Guid.NewGuid(),
                    Category = new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "Food",
                        UserId = userId
                    }
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Amount = 5.50m,
                    Description = "Transportation Test",
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    UserId = userId,
                    CategoryId = Guid.NewGuid(),
                    Category = new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "Transportations",
                        UserId = userId
                    }
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Amount = 10.50m,
                    Description = "Food Test 2",
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    UserId = userId,
                    CategoryId = Guid.NewGuid(),
                    Category = new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "Food",
                        UserId = userId
                    }
                },
            ]);

        var query = new GetExpensesSummaryQuery(userId, from, to);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.GrandTotal.Should().Be(26);
        result.Value.ExpensesByCategory.Should().HaveCount(2);
        result.Value.ExpensesByCategory.First(c => c.CategoryName == "Food").TotalAmount.Should().Be(20.50m);
        result.Value.ExpensesByCategory.First(c => c.CategoryName == "Transportations").TotalAmount.Should().Be(5.50m);
        result.Value.ExpensesByMonth.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetExpensesSummary_Should_ReturnEmptyReport_When_NoExpensesExist()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var from = DateOnly.FromDateTime(DateTime.UtcNow);
        var to = from.AddDays(5);
        var token = CancellationToken.None;

        uow.Expenses.GetAllExpensesByUserIdWithCategoryAsync(userId, from, to, token)
            .Returns([]);

        var query = new GetExpensesSummaryQuery(userId, from, to);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.GrandTotal.Should().Be(0);
        result.Value.ExpensesByCategory.Should().BeEmpty();
        result.Value.ExpensesByMonth.Should().BeEmpty();
    }
}
