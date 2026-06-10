using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Domain.Entities;
using QuestPDF.Elements.Table;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ExpenseTracker.Infrastructure.Services;

public class ReportDocumentService(IReadOnlyList<Expense> expenses, ReportPdfRequestDto request) : IDocument
{
    private readonly IReadOnlyList<Expense> _expenses = expenses;
    private readonly ReportPdfRequestDto _request = request;

    private const string AccentColor = "#3b82c4";
    private const string MutedColor = "#9ca3af";
    private const string BorderColor = "#e5e7eb";

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.PaddingBottom(16).BorderBottom(1).BorderColor(BorderColor).Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("Cointrol — Report")
                    .FontSize(18).FontColor(AccentColor).Bold();
                col.Item().PaddingTop(4).Text(GetPeriodLabel())
                    .FontSize(11).FontColor(MutedColor);
            });

            row.ConstantItem(160).AlignRight().Column(col =>
            {
                col.Item().Text($"Generated on {DateTime.Now:dd MMM yyyy}")
                    .FontSize(9).FontColor(MutedColor);
                col.Item().PaddingTop(2).Text($"View: {_request.View}")
                    .FontSize(9).FontColor(MutedColor);
            });
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingTop(20).Column(col =>
        {
            col.Spacing(20);
            col.Item().Element(ComposeKpi);

            if (_request.ChartImageBase64 is not null)
                col.Item().Element(ComposeChart);

            col.Item().Element(ComposeTable);
        });
    }

    private void ComposeKpi(IContainer container)
    {
        var total = _expenses.Sum(e => e.Amount);
        var count = _expenses.Count;
        var days = _request.View == "annual"
            ? 365
            : DateTime.DaysInMonth(_request.Year, _request.Month);
        var avg = total / days;

        container.Row(row =>
        {
            KpiCell(row.RelativeItem(), "Total", $"€ {total:N2}");
            row.ConstantItem(12);
            KpiCell(row.RelativeItem(), "Expenses", count.ToString());
            row.ConstantItem(12);
            KpiCell(row.RelativeItem(), "Daily avg", $"€ {avg:N2}");
        });
    }

    private static void KpiCell(IContainer container, string label, string value)
    {
        container
            .Border(1).BorderColor(BorderColor)
            .Padding(12)
            .Column(col =>
            {
                col.Item().Text(label).FontSize(9).FontColor(MutedColor);
                col.Item().PaddingTop(4).Text(value).FontSize(16).Bold();
            });
    }

    private void ComposeChart(IContainer container)
    {
        var imageBytes = Convert.FromBase64String(_request.ChartImageBase64!);

        container.Column(col =>
        {
            col.Item().PaddingBottom(8).Text("Spending chart")
                .FontSize(11).FontColor(MutedColor);
            col.Item().Image(imageBytes).FitWidth();
        });
    }

    private void ComposeTable(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().PaddingBottom(8).Text("Expenses")
                .FontSize(11).FontColor(MutedColor);

            col.Item().Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(70);
                    cols.RelativeColumn(3);
                    cols.RelativeColumn(2);
                    cols.ConstantColumn(80);
                });

                table.Header(header =>
                {
                    TableHeaderCell(header.Cell(), "Date");
                    TableHeaderCell(header.Cell(), "Description");
                    TableHeaderCell(header.Cell(), "Category");
                    header.Cell().AlignRight().PaddingVertical(6)
                        .Text("Amount").Bold().FontSize(9).FontColor(MutedColor);
                });

                foreach (var expense in _expenses.OrderBy(e => e.Date))
                {
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(BorderColor)
                        .Text(expense.Date.ToString("dd MMM yyyy")).FontSize(9);
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(BorderColor)
                        .Text(expense.Description ?? "-").FontSize(9);
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(BorderColor)
                        .Text(expense.Category?.Name ?? "-").FontSize(9);
                    table.Cell().AlignRight().PaddingVertical(5).BorderBottom(1).BorderColor(BorderColor)
                        .Text($"€ {expense.Amount:N2}").FontSize(9);
                }

                table.Cell().ColumnSpan(3).PaddingTop(8)
                    .Text("Total").Bold().FontSize(10);
                table.Cell().AlignRight().PaddingTop(8)
                    .Text($"€ {_expenses.Sum(e => e.Amount):N2}").Bold().FontSize(10).FontColor(AccentColor);
            });
        });
    }

    private static void TableHeaderCell(ITableCellContainer cell, string text)
    {
        cell.PaddingVertical(6).Text(text).Bold().FontSize(9).FontColor(MutedColor);
    }

    private void ComposeFooter(IContainer container)
    {
        container.PaddingTop(12).BorderTop(1).BorderColor(BorderColor)
            .AlignCenter().Text(text =>
            {
                text.Span("Cointrol  •  ").FontSize(8).FontColor(MutedColor);
                text.CurrentPageNumber().FontSize(8).FontColor(MutedColor);
                text.Span(" / ").FontSize(8).FontColor(MutedColor);
                text.TotalPages().FontSize(8).FontColor(MutedColor);
            });
    }

    private string GetPeriodLabel() => _request.View switch
    {
        "annual" => $"Annual report — {_request.Year}",
        "category" => $"By category — {new DateTime(_request.Year, _request.Month, 1):MMMM yyyy}",
        _ => $"Monthly report — {new DateTime(_request.Year, _request.Month, 1):MMMM yyyy}"
    };
}