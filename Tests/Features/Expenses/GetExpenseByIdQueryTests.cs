using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Expenses.Queries;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Expenses;

public class GetExpenseByIdQueryTests
{
    private readonly IUnitOfWork uow;
    private readonly GetExpenseByIdHandler sut;

    public GetExpenseByIdQueryTests()
    {
        uow = Substitute.For<IUnitOfWork>();

        sut = new GetExpenseByIdHandler(uow);
    }

    [Fact]
    public async Task GetExpenseByIdHandler_Should_ReturnNotFound_When_RecordDoesNotExist()
    {
        //Arrange
        var expenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns((Expense?)null);
        var query = new GetExpenseByIdQuery(expenseId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Expense.NotFound");
        result.FirstError.Description.Should().Be("Expense was not found.");
    }

    [Fact]
    public async Task GetExpenseByIdHandler_Should_ReturnExpenseReadDto_When_RecordExists()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var expense = new Expense
        {
            Id = expenseId,
            Amount = 20.99m, //'m' stands for a decimal number
            Description = "Description Test",
            Date = DateOnly.FromDateTime(DateTime.Now),
            UserId = userId,
            CategoryId = categoryId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Category Name Test",
                UserId = userId
            }
        };

        uow.Expenses.GetExpenseByIdAsync(expenseId, userId, token).Returns(expense);
        var query = new GetExpenseByIdQuery(expenseId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeFalse();
        
        //Singular fields are checked because 'CreatedAt' differs between the Dto and the Entity by some milliseconds
        result.Value.Id.Should().Be(expenseId);
        result.Value.Amount.Should().Be(20.99m);
        result.Value.Description.Should().Be("Description Test");
        result.Value.CategoryId.Should().Be(categoryId);
        result.Value.CategoryName.Should().Be("Category Name Test");
    }
}
