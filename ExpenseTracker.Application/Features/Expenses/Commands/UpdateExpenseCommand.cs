using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using FluentValidation;
using MediatR;

namespace ExpenseTracker.Application.Features.Expenses.Commands;

public record UpdateExpenseCommand(ExpenseUpdateDto Dto, Guid ExpenseId, Guid UserId) : IRequest<ErrorOr<ExpenseReadDto>>;

public class UpdateExpenseHandler(IUnitOfWork uow,
    IValidator<ExpenseUpdateDto> updateValidator
) : IRequestHandler<UpdateExpenseCommand, ErrorOr<ExpenseReadDto>>
{
    public async Task<ErrorOr<ExpenseReadDto>> Handle(UpdateExpenseCommand request, CancellationToken token)
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
        var expenseDb = await uow.Expenses.GetExpenseByIdAsync(request.ExpenseId, request.UserId, token);
        if(expenseDb is null) return Error.NotFound("Expense.NotFound", "The expense could not be found.");

        request.Dto.ExpenseUpdateEntity(expenseDb);
        if(!await uow.Complete(token)) return Error.Failure("Expense.Failure", "There has been a problem during the update of the expense.");

        return expenseDb.ExpenseToReadDto();
    }
}
