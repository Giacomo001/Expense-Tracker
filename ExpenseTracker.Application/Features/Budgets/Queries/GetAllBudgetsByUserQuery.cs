using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using MediatR;

namespace ExpenseTracker.Application.Features.Budgets.Queries;

public record GetAllBudgetsByUserQuery(Guid UserId) : IRequest<ErrorOr<IReadOnlyList<BudgetReadDto>>>;

public class GetAllBudgetsByUserHandler(IUnitOfWork uow) : IRequestHandler<GetAllBudgetsByUserQuery, ErrorOr<IReadOnlyList<BudgetReadDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<BudgetReadDto>>> Handle(GetAllBudgetsByUserQuery request, CancellationToken token)
    {
        var budgets = await uow.Budgets.GetAllBudgetsByUserIdAsync(request.UserId, token);

        return budgets
            .Select(b => b.BudgetToReadDto())
            .ToList()
            .AsReadOnly();
    }
}