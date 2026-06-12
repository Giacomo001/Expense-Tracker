using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Budgets.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using NSubstitute;

namespace BudgetTracker.Tests.Features.Budgets;

public class UpdateBudgetCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly IValidator<BudgetUpdateDto> updateValidator;
    private readonly UpdateBudgetHandler sut;

    public UpdateBudgetCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        updateValidator = Substitute.For<IValidator<BudgetUpdateDto>>();
        sut = new UpdateBudgetHandler(uow, updateValidator);
    }

    [Fact]
    public async Task UpdateBudgetCommand_Should_ReturnValidationError_When_InputInvalid()
    {
        //Arrange
        var budgetId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new BudgetUpdateDto
        (
            Amount: 200m
        );

        updateValidator.ValidateAsync(Arg.Any<BudgetUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(new List<ValidationFailure>
            {
                new("Amount", "The amount cannot be lesser or equal than 0")
            }));

        var command = new UpdateBudgetCommand(dto, budgetId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task UpdateBudgetCommand_Should_ReturnNotFoundError_When_RecordDoesNotExist()
    {
        //Arrange
        var budgetId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new BudgetUpdateDto
        (
            Amount: 200m
        );

        updateValidator.ValidateAsync(Arg.Any<BudgetUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Budgets.GetBudgetByIdAsync(budgetId, userId, token).Returns((Budget)null!);
        var command = new UpdateBudgetCommand(dto, budgetId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("Budget.NotFound");
        result.FirstError.Description.Should().Be("Budget could not be found.");
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task UpdateBudgetCommand_Should_ReturnFailureError_When_UpdateUnsuccessful()
    {
        //Arrange
        var budgetId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new BudgetUpdateDto
        (
            Amount: 200m
        );

        var entity = new Budget
        {
            Id = budgetId,
            Amount = 500m,
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

        updateValidator.ValidateAsync(Arg.Any<BudgetUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Budgets.GetBudgetByIdAsync(budgetId, userId, token).Returns(entity);
        var command = new UpdateBudgetCommand(dto, budgetId, userId);

        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("Budget.Failure");
        result.FirstError.Description.Should().Be("The update of the budget was unsuccessful.");
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task UpdateBudgetCommand_Should_ReturnBudgetReadDto_When_UpdateSuccessful()
    {
        //Arrange
        var budgetId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new BudgetUpdateDto
        (
            Amount: 200m
        );

        var entity = new Budget
        {
            Id = budgetId,
            Amount = 500m,
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

        updateValidator.ValidateAsync(Arg.Any<BudgetUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Budgets.GetBudgetByIdAsync(budgetId, userId, token).Returns(entity);
        var command = new UpdateBudgetCommand(dto, budgetId, userId);

        uow.Complete(token).Returns(true);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Id.Should().Be(budgetId);
        result.Value.Amount.Should().Be(200m);
        await uow.Received(1).Complete(token);
    }
}