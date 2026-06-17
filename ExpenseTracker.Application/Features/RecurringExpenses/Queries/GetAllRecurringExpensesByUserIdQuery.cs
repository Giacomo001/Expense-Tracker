using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Queries;

public record GetAllRecurringExpensesByUserIdQuery(Guid UserId) : IRequest<ErrorOr<IReadOnlyList<RecurringExpenseReadDto>>>;

public class GetAllRecurringExpensesByUserIdHandler(IUnitOfWork uow) : 
    IRequestHandler<GetAllRecurringExpensesByUserIdQuery, 
    ErrorOr<IReadOnlyList<RecurringExpenseReadDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<RecurringExpenseReadDto>>> Handle(GetAllRecurringExpensesByUserIdQuery request, CancellationToken token) 
    {
        var recExpenses = await uow.RecurringExpenses.GetAllRecurringExpensesByUserIdAsync(request.UserId, token);

        return recExpenses
            .Select(r => r.RecurringExpenseToReadDto())
            .ToList()
            .AsReadOnly();
    }
}
