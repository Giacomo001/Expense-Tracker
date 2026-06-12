using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using FluentValidation;
using MediatR;

namespace ExpenseTracker.Application.Features.Budgets.Commands;

public record CreateBudgetCommand(BudgetCreateDto Dto, Guid UserId) : IRequest<ErrorOr<BudgetReadDto>>;

public class CreateBudgetHandler(
    IUnitOfWork uow, 
    IValidator<BudgetCreateDto> createValidator
) : IRequestHandler<CreateBudgetCommand, ErrorOr<BudgetReadDto>>
{
   public async Task<ErrorOr<BudgetReadDto>> Handle(CreateBudgetCommand request, CancellationToken token)
    {
        var validationResult = await createValidator.ValidateAsync(request.Dto, token);
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.PropertyName, e.ErrorMessage))
                .ToList();
        }

        //Check if a budget for the specified category was already created
        var existingBudget = await uow.Budgets.GetBudgetByCategoryIdAsync(request.Dto.CategoryId, request.UserId, token);
        if(existingBudget is not null) return Error.Conflict("Budget.Conflict", "A budget for this category already exists.");

        var budget = request.Dto.BudgetCreateToEntity(request.UserId);
        await uow.Budgets.CreateBudgetAsync(budget, token);
        if(!await uow.Complete(token)) return Error.Failure("Budget.Failure", "The creation of the budget was unsuccessful.");

        var budgetWithCategory = await uow.Budgets.GetBudgetByIdAsync(budget.Id, request.UserId, token);
        if (budgetWithCategory is null) return Error.Failure("Budget.Create", "An error occurred retrieving the created budget.");

        return budgetWithCategory.BudgetToReadDto();
    } 
}