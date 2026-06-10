using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Domain.Entities;

namespace ExpenseTracker.Application.Interfaces.Services;

public interface IReportGeneratorService
{
    byte[] Generate(IReadOnlyList<Expense> expenses, ReportPdfRequestDto request);
}