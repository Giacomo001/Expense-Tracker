using ErrorOr;
using ExpenseTracker.Application.Features.Budgets.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using NSubstitute;

namespace BudgetTracker.Tests.Features.Budgets;

public class DeleteBudgetCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly DeleteBudgetHandler sut;

    public DeleteBudgetCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        sut = new DeleteBudgetHandler(uow);
    }

    [Fact]
    public async Task DeleteBudgetCommand_Should_ReturnNotFoundError_When_RecordDoesNotExist()
    {
        //Arrange
        var budgetId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.Budgets.GetBudgetByIdAsync(budgetId, userId, token).Returns((Budget?)null);
        var command = new DeleteBudgetCommand(budgetId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("Budget.NotFound");
        result.FirstError.Description.Should().Be("Budget could not be found.");
        uow.Budgets.DidNotReceive().DeleteBudget(Arg.Any<Budget>());
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task DeleteBudgetCommand_Should_ReturnFailureError_When_DeleteUnsuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var budgetId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var budget = new Budget
        {
            Id = budgetId,
            Amount = 200m,
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

        uow.Budgets.GetBudgetByIdAsync(budgetId, userId, token).Returns(budget);
        var command = new DeleteBudgetCommand(budgetId, userId);
        uow.Complete(token).Returns(false);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("Budget.Failure");
        result.FirstError.Description.Should().Be("The budget could not be deleted.");
        uow.Budgets.Received(1).DeleteBudget(Arg.Any<Budget>());
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task DeleteBudgetCommand_Should_ReturnDeleted_When_DeleteSuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var budgetId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var budget = new Budget
        {
            Id = budgetId,
            Amount = 200m,
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

        uow.Budgets.GetBudgetByIdAsync(budgetId, userId, token).Returns(budget);
        var command = new DeleteBudgetCommand(budgetId, userId);
        uow.Complete(token).Returns(true);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Deleted);
        uow.Budgets.Received(1).DeleteBudget(Arg.Any<Budget>());
        await uow.Received(1).Complete(token);
    }
}
