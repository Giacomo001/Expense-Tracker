using System;
using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Infrastructure.Services.Email;

public class EmailSettings
{
    public const string SectionName = "Email";

    [Required(AllowEmptyStrings = false)]
    public required string Host { get; init; }

    [Range(1, 65535)]
    public required int Port { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [EmailAddress]
    public required string FromEmail { get; init; }

    [Required(AllowEmptyStrings = false)]
    public required string FromName { get; init; }
    public bool UseSsl { get; init; } = true; 
}
