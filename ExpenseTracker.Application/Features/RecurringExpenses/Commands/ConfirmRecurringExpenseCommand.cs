using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Application.Utils;
using ExpenseTracker.Domain.Entities;
using MediatR;

namespace ExpenseTracker.Application.Features.RecurringExpenses.Commands;

public record ConfirmRecurringExpenseCommand(RecurringExpenseConfirmDto Dto, Guid RecExpenseId, Guid UserId) : IRequest<ErrorOr<ExpenseReadDto>>;

public class ConfirmRecurringExpenseHandler(IUnitOfWork uow) : IRequestHandler<ConfirmRecurringExpenseCommand, ErrorOr<ExpenseReadDto>>
{
    public async Task<ErrorOr<ExpenseReadDto>> Handle(ConfirmRecurringExpenseCommand request, CancellationToken token)
    {
        var recExpenseDb = await uow.RecurringExpenses.GetRecurringExpenseByIdAsync(request.RecExpenseId, request.UserId, token);
        if (recExpenseDb is null) return Error.NotFound("RecurringExpense.NotFound", "Recurring expense was not found.");

        //A new Expense is created
        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            Amount = request.Dto.Amount,
            Description = request.Dto.Description,
            Date = recExpenseDb.NextDueDate!.Value,
            CategoryId = recExpenseDb.CategoryId,
            UserId = request.UserId,
            RecurringExpenseId = recExpenseDb.Id
        };

        await uow.Expenses.CreateExpenseAsync(expense, token);

        //The user chose to update the template for EVERY future instance
        if(request.Dto.UpdateTemplate)
        {
            //Update the RecurringExpense template with the new parameters
            recExpenseDb.Amount = request.Dto.Amount;
            recExpenseDb.Description = request.Dto.Description;            
        }

        //NextDueDate is calculated and moved on
        recExpenseDb.NextDueDate = RecurrenceDateCalculatorService.Calculate(recExpenseDb.NextDueDate!.Value, recExpenseDb.Frequency);

        if (!await uow.Complete(token)) return Error.Failure("RecurringExpense.Failure", "An error occurred confirming the recurring expense.");

        var expenseWithCategory = await uow.Expenses.GetExpenseByIdAsync(expense.Id, request.UserId, token);
        if (expenseWithCategory is null) return Error.Failure("RecurringExpense.Failure", "An error occurred retrieving the confirmed expense.");

        return expenseWithCategory.ExpenseToReadDto();
    }
}
