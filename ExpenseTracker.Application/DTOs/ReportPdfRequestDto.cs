namespace ExpenseTracker.Application.DTOs;

public record ReportPdfRequestDto
{
    public string View { get; set; } = "monthly"; //monthly | annual | category
    public int Year { get; set; }
    public int Month { get; set; }
    public string? CategoryId { get; set; }
    public string? ChartImageBase64 { get; set; } //The chart sent from the frontend
}