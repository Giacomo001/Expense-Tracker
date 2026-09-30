using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using FluentValidation;
using MediatR;

namespace ExpenseTracker.Application.Features.Budgets.Commands;

public record UpdateBudgetCommand(BudgetUpdateDto Dto, Guid BudgetId, Guid UserId) : IRequest<ErrorOr<BudgetReadDto>>;

public class UpdateBudgetHandler(
    IUnitOfWork uow,
    IValidator<BudgetUpdateDto> updateValidator
) : IRequestHandler<UpdateBudgetCommand, ErrorOr<BudgetReadDto>>
{
    public async Task<ErrorOr<BudgetReadDto>> Handle(UpdateBudgetCommand request, CancellationToken token)
    {
        var validationResult = await updateValidator.ValidateAsync(request.Dto, token);
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.PropertyName, e.ErrorMessage))
                .ToList();
        }

        //Check using the budget on the DB
        var budgetDb = await uow.Budgets.GetBudgetByIdAsync(request.BudgetId, request.UserId, token);
        if(budgetDb is null) return Error.NotFound("Budget.NotFound", "Budget could not be found.");

        request.Dto.BudgetUpdateEntity(budgetDb);
        if(!await uow.Complete(token)) return Error.Failure("Budget.Failure", "The update of the budget was unsuccessful.");

        return budgetDb.BudgetToReadDto();
    }
}