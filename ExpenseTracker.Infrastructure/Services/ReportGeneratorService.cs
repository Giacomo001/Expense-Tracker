using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Services;
using ExpenseTracker.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace ExpenseTracker.Infrastructure.Services;

public class ReportGeneratorService : IReportGeneratorService
{
    public byte[] Generate(IReadOnlyList<Expense> expenses, ReportPdfRequestDto request)
    {
        QuestPDF.Settings.License = LicenseType.Community;        
        var document = new ReportDocumentService(expenses, request);
        
        return document.GeneratePdf();
    }
}