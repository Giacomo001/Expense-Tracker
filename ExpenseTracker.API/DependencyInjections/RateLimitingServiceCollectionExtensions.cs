using System;
using System.Threading.RateLimiting;

namespace ExpenseTracker.API.DependencyInjections;

public static class RateLimitingServiceCollectionExtensions
{
    public const string LoginPolicy = "login";
    public const string RegisterPolicy = "register";
    public const string ForgotPasswordPolicy = "forgot-password";

    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(opt =>
        {
            //Default 429, customizable to add 'Retry-After'
            opt.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            opt.OnRejected = async (context, cancellationToken) =>
            {
                if(context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                }

                await context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    title = "Too many requests. Please try again later.",
                    status = StatusCodes.Status429TooManyRequests
                }, cancellationToken);
            };

            //Global fallback: protect the entire API from a generic flood
            opt.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                var partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                   PermitLimit = 5,
                   Window = TimeSpan.FromMinutes(5),
                   QueueLimit = 0 
                });
            });

            //Dedicated Policy: /login → 5 tries every 5 minutes for IP
            opt.AddPolicy(LoginPolicy, httpContext =>
            {
                var partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(5),
                    QueueLimit = 0
                });
            });

            //Dedicated Policy: /register → 3 registrations every 10 minutes for IP
            opt.AddPolicy(RegisterPolicy, httpContext =>
            {
                var partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 3,
                    Window = TimeSpan.FromMinutes(10),
                    QueueLimit = 0
                });
            });

            //Dedicated Policy: /forgot-password → partitioned for IP
            opt.AddPolicy(ForgotPasswordPolicy, httpContext =>
            {
                var partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 3,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0
                });
            });
        });

        return services;
    }
}
