using ErrorOr;
using ExpenseTracker.Application.Interfaces.Repositories;
using MediatR;

namespace ExpenseTracker.Application.Features.Budgets.Commands;

public record DeleteBudgetCommand(Guid BudgetId, Guid UserId) : IRequest<ErrorOr<Deleted>>;

public class DeleteBudgetHandler(IUnitOfWork uow) : IRequestHandler<DeleteBudgetCommand, ErrorOr<Deleted>>
{
    public async Task<ErrorOr<Deleted>> Handle(DeleteBudgetCommand request, CancellationToken token)
    {
        var budgetDb = await uow.Budgets.GetBudgetByIdAsync(request.BudgetId, request.UserId, token);
        if(budgetDb is null) return Error.NotFound("Budget.NotFound", "Budget could not be found.");

        uow.Budgets.DeleteBudget(budgetDb);
        if(!await uow.Complete(token)) return Error.Failure("Budget.Failure", "The budget could not be deleted.");

        return Result.Deleted;
    }
}