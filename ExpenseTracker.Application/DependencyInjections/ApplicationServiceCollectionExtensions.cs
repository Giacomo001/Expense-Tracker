using System;
using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace ExpenseTracker.Application.DependencyInjections;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        //RegisterServicesFromAssembly - registra automaticamente tutti gli Handler che vengono scritti nelle Features senza doverli aggiungere uno per uno
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

        //AddValidatorsFromAssembly — tutti i validator FluentValidation vengono registrati automaticamente.
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        return services;
    }
}
