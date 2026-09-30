
using System;
using System.Net;
using System.Text.Json;
using ErrorOr;

namespace ExpenseTracker.API.Middleware;

public class ExceptionsHandlingMiddleware(RequestDelegate next, ILogger<ExceptionsHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        } catch(Exception ex)
        {
            logger.LogError(ex, "Unhandled exception occurred.");
            await HandlingException(context, ex);
        }
    }

    private static async Task HandlingException(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = new
        {
            status = context.Response.StatusCode,
            error = "An unexpected error occurred.",
            detail = exception.Message
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
