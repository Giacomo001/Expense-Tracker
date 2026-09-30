using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using MediatR;

namespace ExpenseTracker.Application.Features.Budgets.Queries;

public record GetBudgetByIdQuery(Guid BudgetId, Guid UserId) : IRequest<ErrorOr<BudgetReadDto>>;

public class GetBudgetByIdHandler(IUnitOfWork uow) : IRequestHandler<GetBudgetByIdQuery, ErrorOr<BudgetReadDto>>
{
    public async Task<ErrorOr<BudgetReadDto>> Handle(GetBudgetByIdQuery request, CancellationToken token)
    {
        var budget = await uow.Budgets.GetBudgetByIdAsync(request.BudgetId, request.UserId, token);
        if(budget is null) return Error.NotFound("Budget.NotFound", "Budget could not be found.");

        return budget.BudgetToReadDto();
    }
}