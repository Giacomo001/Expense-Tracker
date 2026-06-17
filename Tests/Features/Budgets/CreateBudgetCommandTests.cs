using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Budgets.Commands;
using ExpenseTracker.Application.Features.Budgets.Queries;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Budgets;

public class CreateBudgetCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly IValidator<BudgetCreateDto> createValidator;
    private readonly CreateBudgetHandler sut;

    public CreateBudgetCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        createValidator = Substitute.For<IValidator<BudgetCreateDto>>();
        sut = new CreateBudgetHandler(uow, createValidator);
    }

    [Fact]
    public async Task CreateBudgetCommand_Should_ReturnErrorList_When_InputIsInvalid()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var budgetCreate = new BudgetCreateDto
        (
            Amount: 200m,
            CategoryId: categoryId
        );

        createValidator.ValidateAsync(Arg.Any<BudgetCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(new List<ValidationFailure>
            {
                new("Amount", "Amount cannot be lesser or equal than 0")
            }));

        var command = new CreateBudgetCommand(budgetCreate, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        await uow.Budgets.DidNotReceive().CreateBudgetAsync(Arg.Any<Budget>(), token);
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task CreateBudgetCommand_Should_ReturnConflictError_When_BudgetIsAlreadyPresent()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var budgetId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var existingBudget = new Budget
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

        var budget = new BudgetCreateDto 
        (
            Amount: 500m,
            CategoryId: categoryId
        );

        createValidator.ValidateAsync(Arg.Any<BudgetCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        //It forced the test to return an existing Budget
        uow.Budgets.GetBudgetByCategoryIdAsync(categoryId, userId, token).Returns(existingBudget);

        var command = new CreateBudgetCommand(budget, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
        result.FirstError.Code.Should().Be("Budget.Conflict");
        result.FirstError.Description.Should().Be("A budget for this category already exists.");
    }

    [Fact]
    public async Task CreateBudgetCommand_Should_ReturnFailureError_When_CreationFailed()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var budgetCreate = new BudgetCreateDto
        (
            Amount: 200m,
            CategoryId: categoryId
        );

        createValidator.ValidateAsync(Arg.Any<BudgetCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        var command = new CreateBudgetCommand(budgetCreate, userId);
        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        await uow.Budgets.Received(1).CreateBudgetAsync(Arg.Any<Budget>(), token);
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task CreateBudgetCommand_Should_ReturnBudgetReadDto_When_CreationSuccessful()
    {
        //Arrange
        var budgetId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var budgetCreate = new BudgetCreateDto
        (
            Amount: 200m,
            CategoryId: categoryId
        );

        var budgetEntity = new Budget
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

        createValidator.ValidateAsync(Arg.Any<BudgetCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Budgets.GetBudgetByCategoryIdAsync(categoryId, userId, token).Returns((Budget?)null);
        uow.Budgets.GetBudgetByIdAsync(Arg.Any<Guid>(), userId, token).Returns(budgetEntity);
        uow.Complete(token).Returns(true);

        var command = new CreateBudgetCommand(budgetCreate, userId);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Id.Should().NotBeEmpty();
        result.Value.Amount.Should().Be(200m);
        await uow.Budgets.Received(1).CreateBudgetAsync(Arg.Any<Budget>(), token);
        await uow.Received(1).Complete(token);
    }
}