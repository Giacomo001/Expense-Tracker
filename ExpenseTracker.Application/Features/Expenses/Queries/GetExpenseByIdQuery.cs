using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using MediatR;

namespace ExpenseTracker.Application.Features.Expenses.Queries;

public record GetExpenseByIdQuery(Guid ExpenseId, Guid UserId) : IRequest<ErrorOr<ExpenseReadDto>>;

public class GetExpenseByIdHandler(IUnitOfWork uow) : 
    IRequestHandler<GetExpenseByIdQuery, 
    ErrorOr<ExpenseReadDto>>
{
    public async Task<ErrorOr<ExpenseReadDto>> Handle(GetExpenseByIdQuery request, CancellationToken token)
    {
        var expense = await uow.Expenses.GetExpenseByIdAsync(request.ExpenseId, request.UserId, token);
        if(expense is null) return Error.NotFound("Expense.NotFound", "Expense was not found.");

        return expense.ExpenseToReadDto();
    }
}