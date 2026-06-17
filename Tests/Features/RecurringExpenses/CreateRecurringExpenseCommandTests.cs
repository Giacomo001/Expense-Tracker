using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.RecurringExpenses.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Utils;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Domain.Enums;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.RecurringRecurringExpenses;

public class CreateRecurringExpenseCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly IValidator<RecurringExpenseCreateDto> createValidator;
    private readonly CreateRecurringExpenseHandler sut;

    public CreateRecurringExpenseCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        createValidator = Substitute.For<IValidator<RecurringExpenseCreateDto>>();
        sut = new CreateRecurringExpenseHandler(uow, createValidator);
    }

    [Fact]
    public async Task CreateRecurringExpenseCommand_Should_ReturnErrorList_When_InputIsInvalid()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var recExpenseCreate = new RecurringExpenseCreateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Frequency: Frequency.Weekly,
            StartDate: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        createValidator.ValidateAsync(Arg.Any<RecurringExpenseCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(new List<ValidationFailure>
            {
                new("Amount", "Amount cannot be lesser or equal than 0")
            }));

        var command = new CreateRecurringExpenseCommand(recExpenseCreate, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        await uow.RecurringExpenses.DidNotReceive().CreateRecurringExpenseAsync(Arg.Any<RecurringExpense>(), token);
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task CreateRecurringExpenseCommand_Should_ReturnErrorFailure_When_CreationFailed()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var recExpenseCreate = new RecurringExpenseCreateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Frequency: Frequency.Weekly,
            StartDate: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        createValidator.ValidateAsync(Arg.Any<RecurringExpenseCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        var command = new CreateRecurringExpenseCommand(recExpenseCreate, userId);
        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("RecurringExpense.Failure");
        result.FirstError.Description.Should().Be("The creation of the recurring expense was unsuccessful.");
        await uow.RecurringExpenses.Received(1).CreateRecurringExpenseAsync(Arg.Any<RecurringExpense>(), token);
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task CreateRecurringExpenseCommand_Should_ReturnFailureError_When_ReloadFails()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var recExpenseCreate = new RecurringExpenseCreateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Frequency: Frequency.Weekly,
            StartDate: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        createValidator.ValidateAsync(Arg.Any<RecurringExpenseCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.Complete(token).Returns(true);

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(Arg.Any<Guid>(), userId, token).Returns((RecurringExpense?)null);
        var command = new CreateRecurringExpenseCommand(recExpenseCreate, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("RecurringExpense.ReloadFailed");
        result.FirstError.Description.Should().Be("An error occurred retrieving the created recurring expense.");
        await uow.RecurringExpenses.Received(1).CreateRecurringExpenseAsync(Arg.Any<RecurringExpense>(), token);
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task CreateRecurringExpenseCommand_Should_ReturnExpenseReadDto_When_CreationSuccess()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        var nextDueDate = RecurrenceDateCalculatorService.Calculate(DateOnly.FromDateTime(DateTime.UtcNow), Frequency.Weekly);

        var recExpenseCreate = new RecurringExpenseCreateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Frequency: Frequency.Weekly,
            StartDate: DateOnly.FromDateTime(DateTime.UtcNow),
            CategoryId: categoryId
        );

        var recExpenseEntity = new RecurringExpense
        {
            Id = Guid.NewGuid(),
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

        createValidator.ValidateAsync(Arg.Any<RecurringExpenseCreateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(Arg.Any<Guid>(), userId, token).Returns(recExpenseEntity);

        var command = new CreateRecurringExpenseCommand(recExpenseCreate, userId);
        uow.Complete(token).Returns(true);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Id.Should().NotBeEmpty();
        result.Value.Frequency.Should().Be(Frequency.Weekly);
        result.Value.NextDueDate.Should().Be(nextDueDate);
        await uow.RecurringExpenses.Received(1).CreateRecurringExpenseAsync(Arg.Any<RecurringExpense>(), token);
        await uow.Received(1).Complete(token);
    }
}