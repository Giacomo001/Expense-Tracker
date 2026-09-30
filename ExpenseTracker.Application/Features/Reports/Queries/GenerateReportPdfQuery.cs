using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Interfaces.Services;
using MediatR;

namespace ExpenseTracker.Application.Features.Reports.Queries;

public record GenerateReportPdfQuery(ReportPdfRequestDto Dto, Guid UserId) : IRequest<ErrorOr<byte[]>>;

public class GenerateReportPdfHandler(IUnitOfWork uow, IReportGeneratorService reportGeneratorService) : IRequestHandler<GenerateReportPdfQuery, ErrorOr<byte[]>>
{
    public async Task<ErrorOr<byte[]>> Handle(GenerateReportPdfQuery request, CancellationToken token)
    {
        var (from, to) = request.Dto.View switch
        {
            "annual" => (
                new DateOnly(request.Dto.Year, 1, 1),
                new DateOnly(request.Dto.Year, 12, 31)
            ),
            _ => (
                new DateOnly(request.Dto.Year, request.Dto.Month, 1),
                new DateOnly(request.Dto.Year, request.Dto.Month, DateTime.DaysInMonth(request.Dto.Year, request.Dto.Month))
            )
        };

        var expenses = await uow.Expenses.GetAllExpensesByUserIdWithCategoryAsync(request.UserId, from, to, token);
        if (!expenses.Any()) return Error.NotFound("Report.Expenses", "No expenses found for the given period.");

        return reportGeneratorService.Generate(expenses, request.Dto);
    }
}