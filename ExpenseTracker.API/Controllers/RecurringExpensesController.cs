using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.RecurringExpenses.Commands;
using ExpenseTracker.Application.Features.RecurringExpenses.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.API.Controllers;

[Authorize]
public class RecurringExpensesController(IMediator mediator) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAllRecurringExpensesByUserId(CancellationToken token)
    {
        var result = await mediator.Send(new GetAllRecurringExpensesByUserIdQuery(UserId), token);

        return result.Match(
            recExpenses => Ok(recExpenses),
            errors => Problem(errors)
        );
    }

    [HttpGet("due")]
    public async Task<IActionResult> GetDueRecurringExpensesByUserId(CancellationToken token)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var result = await mediator.Send(new GetDueRecurringExpensesByUserIdQuery(UserId, today), token);

        return result.Match(
            dueRecExpenses => Ok(dueRecExpenses),
            errors => Problem(errors)
        );
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetRecurringExpenseById(Guid id, CancellationToken token)
    {
        var result = await mediator.Send(new GetRecurringExpenseByIdQuery(id, UserId), token);

        return result.Match(
            recExpense => Ok(recExpense),
            errors => Problem(errors)
        );
    }

    [HttpPost]
    public async Task<IActionResult> CreateRecurringExpense([FromBody] RecurringExpenseCreateDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new CreateRecurringExpenseCommand(dto, UserId), token);

        return result.Match(
            recExpense => CreatedAtAction(nameof(GetRecurringExpenseById), new { id = recExpense.Id }, recExpense),
            errors => Problem(errors)
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateRecurringExpense(Guid id, [FromBody] RecurringExpenseUpdateDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new UpdateRecurringExpenseCommand(dto, id, UserId), token);

        return result.Match(
            recExpense => Ok(recExpense),
            errors => Problem(errors)
        );
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteRecurringExpense(Guid id, CancellationToken token)
    {
        var result = await mediator.Send(new DeleteRecurringExpenseCommand(id, UserId), token);

        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
        );
    }

    //Methods to handle the RecurringExpense after the user's input
    [HttpPost("{id:guid}/confirm")]
    public async Task<IActionResult> ConfirmRecurringExpense(Guid id, [FromBody] RecurringExpenseConfirmDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new ConfirmRecurringExpenseCommand(dto, id, UserId));

        return result.Match(
            expense => Ok(expense),
            errors => Problem(errors)
        );
    }

    [HttpPost("{id:guid}/skip")]
    public async Task<IActionResult> SkipRecurringExpense(Guid id, CancellationToken token)
    {
        var result = await mediator.Send(new SkipRecurringExpenseCommand(id, UserId));

        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
        );
    }

    [HttpPost("{id:guid}/stop")]
    public async Task<IActionResult> StopRecurringExpense(Guid id, CancellationToken token)
    {
        var result = await mediator.Send(new StopRecurringExpenseCommand(id, UserId));

        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
        );
    }
}
