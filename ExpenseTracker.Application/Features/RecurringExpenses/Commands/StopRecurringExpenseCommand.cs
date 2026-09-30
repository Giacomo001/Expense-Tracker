using System;
using ErrorOr;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Domain.Enums;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Commands;

public record StopRecurringExpenseCommand(Guid RecExpenseId, Guid UserId) : IRequest<ErrorOr<Updated>>;

public class StopRecurringExpenseHandler(IUnitOfWork uow) : IRequestHandler<StopRecurringExpenseCommand, ErrorOr<Updated>>
{
    public async Task<ErrorOr<Updated>> Handle(StopRecurringExpenseCommand request, CancellationToken token)
    {
        var recExpenseDb = await uow.RecurringExpenses.GetRecurringExpenseByIdAsync(request.RecExpenseId, request.UserId, token);
        if(recExpenseDb is null) return Error.NotFound("RecurringExpense.NotFound", "Recurring expense was not found.");

        //Updating the record on the Db. EF tracks the changes without needing a repository method
        recExpenseDb.NextDueDate = null;
        recExpenseDb.Frequency = Frequency.Manual;

        if(!await uow.Complete(token)) return Error.Failure("RecurringExpense.Failure", "There has been a problem during the update of the recurring expense.");

        return Result.Updated;
    }
}
