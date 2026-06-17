using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Application.Utils;
using ExpenseTracker.Application.Validators;
using FluentValidation;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Commands;

public record CreateRecurringExpenseCommand(RecurringExpenseCreateDto Dto, Guid UserId) : IRequest<ErrorOr<RecurringExpenseReadDto>>;

public class CreateRecurringExpenseHandler(
    IUnitOfWork uow,
    IValidator<RecurringExpenseCreateDto> createValidator
) : IRequestHandler<CreateRecurringExpenseCommand, ErrorOr<RecurringExpenseReadDto>>
{
    public async Task<ErrorOr<RecurringExpenseReadDto>> Handle(CreateRecurringExpenseCommand request, CancellationToken token)
    {
        var validationResult = await createValidator.ValidateAsync(request.Dto, token);
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.ErrorCode, e.ErrorMessage))
                .ToList();
        };

        //The StartDate is used to set the NextDueDate
        var nextDueDate = RecurrenceDateCalculatorService.Calculate(request.Dto.StartDate, request.Dto.Frequency);
        var recurringExpense = request.Dto.RecurringExpenseCreateToEntity(request.UserId, nextDueDate);

        await uow.RecurringExpenses.CreateRecurringExpenseAsync(recurringExpense, token);
        if(!await uow.Complete(token)) return Error.Failure("RecurringExpense.Failure", "The creation of the recurring expense was unsuccessful.");

        var recurringWithCategory = await uow.RecurringExpenses.GetRecurringExpenseByIdAsync(recurringExpense.Id, request.UserId, token);
        if(recurringWithCategory is null) return Error.Failure("RecurringExpense.ReloadFailed", "An error occurred retrieving the created recurring expense.");

        return recurringWithCategory.RecurringExpenseToReadDto();
    }
}
