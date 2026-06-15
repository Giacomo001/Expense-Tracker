using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Budgets.Commands;
using ExpenseTracker.Application.Features.Budgets.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.API.Controllers;

[Authorize]
public class BudgetsController(IMediator mediator) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAllBudgetsByUserId(CancellationToken token)
    {
        var result = await mediator.Send(new GetAllBudgetsByUserQuery(UserId), token);

        return result.Match(
            budgets => Ok(budgets),
            errors => Problem(errors)
        );
    }

    [HttpGet("{budgetId:guid}")]
    public async Task<IActionResult> GetBudgetById(Guid budgetId, CancellationToken token)
    {
        var result = await mediator.Send(new GetBudgetByIdQuery(budgetId, UserId), token);

        return result.Match(
            budgets => Ok(budgets),
            errors => Problem(errors)
        );
    }

    [HttpGet("category/{categoryId:guid}")]
    public async Task<IActionResult> GetBudgetByCategoryId(Guid categoryId, CancellationToken token)
    {
        var result = await mediator.Send(new GetBudgetByCategoryIdQuery(categoryId, UserId), token);

        return result.Match(
            budgets => Ok(budgets),
            errors => Problem(errors)
        );
    }

    [HttpPost]
    public async Task<IActionResult> CreateBudget([FromBody] BudgetCreateDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new CreateBudgetCommand(dto, UserId), token);

        return result.Match(
            budget => CreatedAtAction(nameof(GetBudgetById), new { budgetId = budget.Id }, budget),
            errors => Problem(errors)
        );
    }

    [HttpPut("{budgetId:guid}")]
    public async Task<IActionResult> UpdateBudget(Guid budgetId, [FromBody] BudgetUpdateDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new UpdateBudgetCommand(dto, budgetId, UserId), token);

        return result.Match(
            budget => Ok(budget),
            errors => Problem(errors)
        );
    }

    [HttpDelete("{budgetId:guid}")]
    public async Task<IActionResult> DeleteBudget(Guid budgetId, CancellationToken token)
    {
        var result = await mediator.Send(new DeleteBudgetCommand(budgetId, UserId), token);

        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
        );
    }
}