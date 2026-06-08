using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
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

        var expense = request.Dto.ExpenseCreateToEntity(request.UserId);
        await uow.Expenses.CreateExpenseAsync(expense, token);
        if(!await uow.Complete(token)) return Error.Failure("Expense.Create", "An error occurred during the creation of the expense.");

        //Reload from DB to get the Category navigation property populated
        var expenseWithCategory = await uow.Expenses.GetExpenseByIdAsync(expense.Id, request.UserId, token);
        if (expenseWithCategory is null) return Error.Failure("Expense.Create", "An error occurred retrieving the created expense.");

        return expense.ExpenseToReadDto();
    }
}
