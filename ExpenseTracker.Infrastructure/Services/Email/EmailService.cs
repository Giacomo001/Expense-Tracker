using System;
using ExpenseTracker.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace ExpenseTracker.Infrastructure.Services.Email;

public class EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger) : IEmailService
{
    private readonly EmailSettings settings = emailSettings.Value;

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(settings.FromName, settings.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Reset your password";

        message.Body = new BodyBuilder
        {
            //It's a good practice to have both the HtmlBody and the TextBody
            HtmlBody = BuildHtmlBody(resetLink),
            TextBody = BuildPlainTextBody(resetLink)
        }.ToMessageBody();

        using var client = new SmtpClient();

        try 
        {
            await client.ConnectAsync(
                settings.Host,
                settings.Port,
                settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None,
                cancellationToken);

            //For testing it's possible to pass empty variables. In production it'll work normally
            if (!string.IsNullOrWhiteSpace(settings.Username))
            {
                await client.AuthenticateAsync(settings.Username, settings.Password, cancellationToken);
            }

            await client.SendAsync(message, cancellationToken);

            logger.LogInformation("Password reset email sent successfully via {Host}", settings.Host);
            
        } 
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send password reset email via {Host}:{Port}", settings.Host, settings.Port);
            throw;
        }        
        finally
        {
            if(client.IsConnected)
            {
                await client.DisconnectAsync(true, cancellationToken);
            }
        }
    }

    //Body building methods
    private static string BuildHtmlBody(string resetLink) => $"""
        <html>
          <body style="font-family: sans-serif; line-height: 1.5;">
            <h2>Reset your password</h2>
            <p>We received a request to reset your password. Click the link below to choose a new one:</p>
            <p><a href="{resetLink}">Reset your password</a></p>
            <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          </body>
        </html>
        """;

    private static string BuildPlainTextBody(string resetLink) => $"""
        Reset your password

        We received a request to reset your password. Open the link below to choose a new one:
        {resetLink}

        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        """;
}
