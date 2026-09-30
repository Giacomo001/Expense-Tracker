using System;
using ErrorOr;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Utils;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Commands;

public record SkipRecurringExpenseCommand(Guid RecExpenseId, Guid UserId) : IRequest<ErrorOr<Updated>>;

public class SkipRecurringExpenseHandler(IUnitOfWork uow) : IRequestHandler<SkipRecurringExpenseCommand, ErrorOr<Updated>>
{
    public async Task<ErrorOr<Updated>> Handle(SkipRecurringExpenseCommand request, CancellationToken token)
    {
        var recExpenseDb = await uow.RecurringExpenses.GetRecurringExpenseByIdAsync(request.RecExpenseId, request.UserId, token);
        if(recExpenseDb is null) return Error.NotFound("RecurringExpense.NotFound", "Recurring expense was not found.");

        /*
            Using the NextDueDate of the record avoids the 'cumulative drift'
            Using DateTime.Today would depend too much on when the user would open the Expense
            If the user would skip the 15th of June but would open the app the 20th of June, the NextDueDate would be set as 20th of July instead of the correct 15th
        */
        recExpenseDb.NextDueDate = RecurrenceDateCalculatorService.Calculate(recExpenseDb.NextDueDate!.Value, recExpenseDb.Frequency);

        if(!await uow.Complete(token)) return Error.Failure("RecurringExpense.Failure", "There has been a problem during the update of the recurring expense.");

        return Result.Updated;
    }
}
