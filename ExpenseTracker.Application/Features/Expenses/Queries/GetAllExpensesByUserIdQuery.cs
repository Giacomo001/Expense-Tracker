using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Domain.Entities;
using MediatR;

namespace ExpenseTracker.Application.Features.Expenses.Queries;

public record GetAllExpensesByUserIdQuery(Guid UserId) : IRequest<ErrorOr<IReadOnlyList<ExpenseReadDto>>>;

public class GetAllExpensesByUserIdHandler(IUnitOfWork uow) : 
    IRequestHandler<GetAllExpensesByUserIdQuery, 
    ErrorOr<IReadOnlyList<ExpenseReadDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<ExpenseReadDto>>> Handle(
        GetAllExpensesByUserIdQuery request, 
        CancellationToken token
    )
    {
        var expenses = await uow.Expenses.GetAllExpensesByUserIdAsync(request.UserId, token);

        return expenses
            .Select(e => e.ExpenseToReadDto())
            .ToList()
            .AsReadOnly();
    }
}