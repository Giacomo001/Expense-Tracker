using ExpenseTracker.API.DependencyInjections;
using ExpenseTracker.API.Middleware;
using ExpenseTracker.Application.DependencyInjections;
using ExpenseTracker.Infrastructure.DependencyInjections;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApi(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapScalarApiReference();
}

app.UseMiddleware<ExceptionsHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();