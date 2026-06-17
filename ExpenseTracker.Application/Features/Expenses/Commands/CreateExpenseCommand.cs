using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Application.Utils;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Domain.Enums;
using FluentValidation;
using MediatR;

namespace ExpenseTracker.Application.Features.Expenses.Commands;

public record CreateExpenseCommand(ExpenseCreateDto Dto, Guid UserId) : IRequest<ErrorOr<ExpenseReadDto>>;

public class CreateExpenseHandler(IUnitOfWork uow,
    IValidator<ExpenseCreateDto> createValidator
) : IRequestHandler<CreateExpenseCommand, ErrorOr<ExpenseReadDto>>
{
    public async Task<ErrorOr<ExpenseReadDto>> Handle(CreateExpenseCommand request, CancellationToken token)
    {
        var validationResult = await createValidator.ValidateAsync(request.Dto, token);
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.ErrorCode, e.ErrorMessage))
                .ToList();
        };

        //It creates the entity using the Mapper
        var expense = request.Dto.ExpenseCreateToEntity(request.UserId);

        //If the Frequency is not 'Manual', it create the RecurrenceExpense
        if(request.Dto.Frequency != Frequency.Manual)
        {
            //It calculates the next date for the Expense
            var nextDueDate = RecurrenceDateCalculatorService.Calculate(request.Dto.Date, request.Dto.Frequency);

            //Handler doesn't do the Entity creation, the Mapper does
            var recurringDto = new RecurringExpenseCreateDto(
                Amount: request.Dto.Amount,
                Description: request.Dto.Description,
                Frequency: request.Dto.Frequency,
                StartDate: request.Dto.Date,
                CategoryId: request.Dto.CategoryId
            );

            var recurringExpense = recurringDto.RecurringExpenseCreateToEntity(request.UserId, nextDueDate);

            await uow.RecurringExpenses.CreateRecurringExpenseAsync(recurringExpense, token);

            //Sets the relation between the Expense and the template
            expense.RecurringExpenseId = recurringExpense.Id;
        }

        await uow.Expenses.CreateExpenseAsync(expense, token);
        if(!await uow.Complete(token)) return Error.Failure("Expense.Create", "An error occurred during the creation of the expense.");

        //Reload from DB to get the Category navigation property populated
        var expenseWithCategory = await uow.Expenses.GetExpenseByIdAsync(expense.Id, request.UserId, token);
        if (expenseWithCategory is null) return Error.Failure("Expense.Create", "An error occurred retrieving the created expense.");

        return expenseWithCategory.ExpenseToReadDto();
    }
}
