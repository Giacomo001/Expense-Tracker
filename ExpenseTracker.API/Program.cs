using ExpenseTracker.API.DependencyInjections;
using ExpenseTracker.API.Middleware;
using ExpenseTracker.Application.DependencyInjections;
using ExpenseTracker.Infrastructure.DependencyInjections;
using Scalar.AspNetCore;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApi(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

QuestPDF.Settings.License = LicenseType.Community;

var app = builder.Build();

//TEST
Console.WriteLine($"[DEBUG] ConnectionString: '{builder.Configuration.GetConnectionString("DefaultConnection")}'");

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseMiddleware<ExceptionsHandlingMiddleware>();

app.UseCors("DevelopmentPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();