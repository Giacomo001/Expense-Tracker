using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using MediatR;

namespace ExpenseTracker.Application.Features.Reports.Queries;

public record GetExpensesSummaryQuery(Guid UserId, DateOnly From, DateOnly To) : IRequest<ErrorOr<ReportDto>>;

public record GetExpensesSummaryHandler(IUnitOfWork uow) : IRequestHandler<GetExpensesSummaryQuery, ErrorOr<ReportDto>>
{
    public async Task<ErrorOr<ReportDto>> Handle(GetExpensesSummaryQuery request, CancellationToken token)
    {
        if(request.From > request.To) return Error.Validation("Report.DataRange", "'From' date must be before the 'To' date.");

        var expenses = await uow.Expenses.GetAllExpensesByUserIdWithCategoryAsync(request.UserId, request.From, request.To, token);
        var byCategory = expenses
            .GroupBy(e => e.Category?.Name ?? "Uncategorized")
            .Select(e => new ExpenseByCategory(e.Key, e.Sum(x => x.Amount)))
            .ToList()
            .AsReadOnly();

        var byMonth = expenses
            .GroupBy(e => new { e.Date.Year, e.Date.Month })
            .OrderBy(e => e.Key.Year)
            .ThenBy(e => e.Key.Month)
            .Select(e => new ExpenseByMonth(e.Key.Year, e.Key.Month, e.Sum(x => x.Amount)))
            .ToList()
            .AsReadOnly();

        var grandTotal = expenses.Sum(x => x.Amount);

        return new ReportDto(byCategory, byMonth, request.From, request.To, grandTotal);
    }
}