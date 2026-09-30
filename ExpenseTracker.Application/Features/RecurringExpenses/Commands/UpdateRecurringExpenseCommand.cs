using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Application.Utils;
using FluentValidation;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Commands;

public record UpdateRecurringExpenseCommand(RecurringExpenseUpdateDto Dto, Guid RecurringExpenseId, Guid UserId) : IRequest<ErrorOr<RecurringExpenseReadDto>>;

public class UpdateRecurringExpenseHandler(IUnitOfWork uow,
    IValidator<RecurringExpenseUpdateDto> updateValidator
) : IRequestHandler<UpdateRecurringExpenseCommand, ErrorOr<RecurringExpenseReadDto>>
{
    public async Task<ErrorOr<RecurringExpenseReadDto>> Handle(UpdateRecurringExpenseCommand request, CancellationToken token)
    {
        //Check to see if the record is valid
        var validationResult = await updateValidator.ValidateAsync(request.Dto, token);
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.ErrorCode, e.ErrorMessage))
                .ToList();
        };

        //Db record recovery
        var recurringExpenseDb = await uow.RecurringExpenses.GetRecurringExpenseByIdAsync(request.RecurringExpenseId, request.UserId, token);
        if(recurringExpenseDb is null) return Error.NotFound("RecurringExpense.NotFound", "The recurring expense could not be found.");

        request.Dto.UpdateRecurringExpenseEntity(recurringExpenseDb);

        //Managing the Frequency and consequently the 'NextDueDate'
        if(request.Dto.Frequency.HasValue && request.Dto.Frequency != recurringExpenseDb.Frequency)
        {
            recurringExpenseDb.Frequency = request.Dto.Frequency.Value;
            recurringExpenseDb.NextDueDate = RecurrenceDateCalculatorService
                .Calculate(recurringExpenseDb.NextDueDate ?? DateOnly.FromDateTime(DateTime.Today), request.Dto.Frequency.Value);
        }

        if(!await uow.Complete(token)) return Error.Failure("RecurringExpense.Failure", "There has been a problem during the update of the recurring expense.");

        return recurringExpenseDb.RecurringExpenseToReadDto();
    }
}