using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Queries;

public record GetDueRecurringExpensesByUserIdQuery(Guid UserId, DateOnly Date) : IRequest<ErrorOr<IReadOnlyList<RecurringExpenseReadDto>>>;

public class GetDueRecurringExpensesByUserIdHandler(IUnitOfWork uow) : 
    IRequestHandler<GetDueRecurringExpensesByUserIdQuery, 
    ErrorOr<IReadOnlyList<RecurringExpenseReadDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<RecurringExpenseReadDto>>> Handle(GetDueRecurringExpensesByUserIdQuery request, CancellationToken token) 
    {
        var recExpenses = await uow.RecurringExpenses.GetDueRecurringExpensesByUserIdAsync(request.UserId, request.Date, token);

        return recExpenses
            .Select(r => r.RecurringExpenseToReadDto())
            .ToList()
            .AsReadOnly();
    }
}
