using System;
using ErrorOr;
using ExpenseTracker.Application.Interfaces.Repositories;
using MediatR;

namespace ExpenseTracker.Application.Features.Expenses.Commands;

public record DeleteExpenseCommand(Guid ExpenseId, Guid UserId) : IRequest<ErrorOr<Deleted>>;

public class DeleteExpenseHandler(IUnitOfWork uow) : IRequestHandler<DeleteExpenseCommand, ErrorOr<Deleted>>
{
    public async Task<ErrorOr<Deleted>> Handle(DeleteExpenseCommand request, CancellationToken token)
    {
        var expenseDb = await uow.Expenses.GetExpenseByIdAsync(request.ExpenseId, request.UserId, token);
        if(expenseDb is null) return Error.NotFound("Expense.NotFound", "The expense was not found");

        uow.Expenses.DeleteExpense(expenseDb);
        if(!await uow.Complete(token)) return Error.Failure("Expense.Failure", "There has been a problem deleting the expense");

        return Result.Deleted;
    }
}