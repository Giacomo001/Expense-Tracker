using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using MediatR;

namespace ExpenseTracker.Application.Features.Budgets.Queries;

public record GetBudgetByCategoryIdQuery(Guid CategoryId, Guid UserId) : IRequest<ErrorOr<BudgetReadDto>>;

public class GetBudgetByCategoryIdHandler(IUnitOfWork uow) : IRequestHandler<GetBudgetByCategoryIdQuery, ErrorOr<BudgetReadDto>>
{
    public async Task<ErrorOr<BudgetReadDto>> Handle(GetBudgetByCategoryIdQuery request, CancellationToken token)
    {
        var budget = await uow.Budgets.GetBudgetByCategoryIdAsync(request.CategoryId, request.UserId, token);
        if(budget is null) return Error.NotFound("Budget.NotFound", "Budget could not be found.");

        return budget.BudgetToReadDto();
    }
}