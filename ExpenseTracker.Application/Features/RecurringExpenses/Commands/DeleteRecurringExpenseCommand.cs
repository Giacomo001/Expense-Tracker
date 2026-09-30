using System;
using ErrorOr;
using ExpenseTracker.Application.Interfaces.Repositories;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Commands;

public record DeleteRecurringExpenseCommand(Guid RecurringExpenseId, Guid UserId) : IRequest<ErrorOr<Deleted>>;

public class DeleteRecurringExpenseHandler(IUnitOfWork uow) : IRequestHandler<DeleteRecurringExpenseCommand, ErrorOr<Deleted>>
{
    public async Task<ErrorOr<Deleted>> Handle(DeleteRecurringExpenseCommand request, CancellationToken token)
    {
        var recExpenseDb = await uow.RecurringExpenses.GetRecurringExpenseByIdAsync(request.RecurringExpenseId, request.UserId, token);
        if(recExpenseDb is null) return Error.NotFound("RecurringExpense.NotFound", "The recurring expense was not found");

        uow.RecurringExpenses.DeleteRecurringExpense(recExpenseDb);
        if(!await uow.Complete(token)) return Error.Failure("RecurringExpense.Failure", "There has been a problem deleting the recurring expense");

        return Result.Deleted;
    }
}