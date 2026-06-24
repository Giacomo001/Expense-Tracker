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

namespace ExpenseTracker.Tests.Features.RecurringExpenses;

public class UpdateRecurringExpenseCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly IValidator<RecurringExpenseUpdateDto> updateValidator;
    private readonly UpdateRecurringExpenseHandler sut;

    public UpdateRecurringExpenseCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        updateValidator = Substitute.For<IValidator<RecurringExpenseUpdateDto>>();
        sut = new UpdateRecurringExpenseHandler(uow, updateValidator);
    }

    [Fact]
    public async Task UpdateRecurringExpenseCommand_Should_ReturnValidationError_When_InputInvalid()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var recExpenseId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new RecurringExpenseUpdateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Frequency: null
        );

        updateValidator.ValidateAsync(Arg.Any<RecurringExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(new List<ValidationFailure>
            {
                new("Amount", "The amount cannot be lesser or equal than 0")
            }));

        var command = new UpdateRecurringExpenseCommand(dto, recExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task UpdateRecurringExpenseCommand_Should_ReturnNotFoundError_When_RecordDoesNotExist()
    {
        //Arrange
        var userId = Guid.NewGuid();
        var recExpenseId = Guid.NewGuid();
        var token = CancellationToken.None;

        var dto = new RecurringExpenseUpdateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Frequency: null
        );

        updateValidator.ValidateAsync(Arg.Any<RecurringExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns((RecurringExpense?)null);
        var command = new UpdateRecurringExpenseCommand(dto, recExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("RecurringExpense.NotFound");
        result.FirstError.Description.Should().Be("The recurring expense could not be found.");
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task UpdateRecurringExpenseCommand_Should_ReturnFailureError_When_UpdateUnsuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var recExpenseId = Guid.NewGuid();
        var token = CancellationToken.None;
        var nextDueDate = RecurrenceDateCalculatorService.Calculate(DateOnly.FromDateTime(DateTime.Today), Frequency.Weekly);

        var dto = new RecurringExpenseUpdateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Frequency: null
        );

        var entity = new RecurringExpense
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
                Color = "#000000",
                UserId = userId
            }
        };

        updateValidator.ValidateAsync(Arg.Any<RecurringExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(entity);
        var command = new UpdateRecurringExpenseCommand(dto, recExpenseId, userId);
        uow.Complete(token).Returns(false);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("RecurringExpense.Failure");
        result.FirstError.Description.Should().Be("There has been a problem during the update of the recurring expense.");
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task UpdateRecurringExpenseCommand_Should_ReturnExpenseReadDto_When_UpdateSuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var recExpenseId = Guid.NewGuid();
        var token = CancellationToken.None;
        var nextDueDate = RecurrenceDateCalculatorService.Calculate(DateOnly.FromDateTime(DateTime.Today), Frequency.Weekly);

        var dto = new RecurringExpenseUpdateDto
        (
            Amount: 20.99m,
            Description: "Description Test",
            Frequency: null
        );

        var entity = new RecurringExpense
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
                Color = "#000000",
                UserId = userId
            }
        };

        updateValidator.ValidateAsync(Arg.Any<RecurringExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recExpenseId, userId, token).Returns(entity);
        var command = new UpdateRecurringExpenseCommand(dto, recExpenseId, userId);
        uow.Complete(token).Returns(true);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Id.Should().Be(recExpenseId);
        result.Value.Frequency.Should().Be(Frequency.Weekly);
        result.Value.NextDueDate.Should().Be(nextDueDate);
        result.Value.Description.Should().Be("Description Test");
        await uow.Received(1).Complete(token);
    }

    //Check to recalculate the NextDueDate
    [Fact]
    public async Task UpdateRecurringExpenseCommand_Should_RecalculateNextDueDate_When_FrequencyChanges()
    {
        //Arrange
        var recurringExpenseId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        var currentNextDueDate = DateOnly.FromDateTime(DateTime.Today);

        var entity = new RecurringExpense
        {
            Id = recurringExpenseId,
            Amount = 500m,
            Description = "Test",
            UserId = userId,
            Frequency = Frequency.Monthly,
            NextDueDate = currentNextDueDate,
            CategoryId = categoryId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var dto = new RecurringExpenseUpdateDto
        (
            Amount: null,
            Description: null,
            Frequency: Frequency.Weekly  //It will change from Monthly to Weekly
        );

        updateValidator.ValidateAsync(Arg.Any<RecurringExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recurringExpenseId, userId, token).Returns(entity);
        uow.Complete(token).Returns(true);

        var command = new UpdateRecurringExpenseCommand(dto, recurringExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        entity.Frequency.Should().Be(Frequency.Weekly);
        entity.NextDueDate.Should().Be(RecurrenceDateCalculatorService.Calculate(currentNextDueDate, Frequency.Weekly));
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task UpdateRecurringExpenseCommand_Should_NotRecalculateNextDueDate_When_FrequencyNotChanged()
    {
        //Arrange
        var recurringExpenseId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;
        var currentNextDueDate = DateOnly.FromDateTime(DateTime.Today);

        var entity = new RecurringExpense
        {
            Id = recurringExpenseId,
            Amount = 500m,
            Description = "Test",
            UserId = userId,
            Frequency = Frequency.Monthly,
            NextDueDate = currentNextDueDate,
            CategoryId = categoryId,
            Category = new Category
            {
                Id = categoryId,
                Name = "Test",
                Color = "#000000",
                UserId = userId
            }
        };

        var dto = new RecurringExpenseUpdateDto
        (
            Amount: 200m,
            Description: null,
            Frequency: null  //Frequency doesn't change
        );

        updateValidator.ValidateAsync(Arg.Any<RecurringExpenseUpdateDto>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recurringExpenseId, userId, token).Returns(entity);
        uow.Complete(token).Returns(true);

        var command = new UpdateRecurringExpenseCommand(dto, recurringExpenseId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        entity.Frequency.Should().Be(Frequency.Monthly); //No changes
        entity.NextDueDate.Should().Be(currentNextDueDate); //No changes
        entity.Amount.Should().Be(200m); //Updated
        await uow.Received(1).Complete(token);
    }
}