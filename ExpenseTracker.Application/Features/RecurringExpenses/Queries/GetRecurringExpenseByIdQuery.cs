using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Queries;

public record GetRecurringExpenseByIdQuery(Guid RecurringExpenseId, Guid UserId) : IRequest<ErrorOr<RecurringExpenseReadDto>>;

public class GetRecurringExpenseByIdHandler(IUnitOfWork uow) : 
    IRequestHandler<GetRecurringExpenseByIdQuery, 
    ErrorOr<RecurringExpenseReadDto>>
{
    public async Task<ErrorOr<RecurringExpenseReadDto>> Handle(GetRecurringExpenseByIdQuery request, CancellationToken token) 
    {
        var recExpense = await uow.RecurringExpenses.GetRecurringExpenseByIdAsync(request.RecurringExpenseId, request.UserId, token);
        if(recExpense is null) return Error.NotFound("RecurringExpense.NotFound", "Recurring expense was not found.");

        return recExpense.RecurringExpenseToReadDto();
    }
}