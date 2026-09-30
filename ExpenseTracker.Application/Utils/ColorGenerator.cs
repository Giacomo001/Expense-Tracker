namespace ExpenseTracker.Application.Utils;

public static class ColorGeneratorService
{
    private static readonly string[] Palette =
    [
        "#2563EB", "#0891B2", "#16A34A", "#D97706",
        "#DC2626", "#7C3AED", "#DB2777", "#059669",
        "#EA580C", "#0284C7", "#65A30D", "#9333EA",
        "#E11D48", "#0D9488", "#B45309", "#4F46E5",
        "#0369A1", "#15803D", "#C2410C", "#7E22CE"
    ];

    public static string Generate()
    {
        return Palette[Random.Shared.Next(Palette.Length)];
    }
}