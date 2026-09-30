using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Expenses.Commands;
using ExpenseTracker.Application.Features.Expenses.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.API.Controllers;
[Authorize]
public class ExpensesController(IMediator mediator) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAllExpenses(CancellationToken token)
    {
        var result = await mediator.Send(new GetAllExpensesByUserIdQuery(UserId), token);

        return result.Match(
            expenses => Ok(expenses),
            errors => Problem(errors)
        );
    }

    [HttpGet("{expenseId:guid}")]
    public async Task<IActionResult> GetExpenseById(Guid expenseId, CancellationToken token)
    {
        var result = await mediator.Send(new GetExpenseByIdQuery(expenseId, UserId), token);

        return result.Match(
            expense => Ok(expense),
            errors => Problem(errors)
        );
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] ExpenseCreateDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new CreateExpenseCommand(dto, UserId), token);

        return result.Match(
            //The name of 'expenseId =' MUST BE the same as the parameter passed in the right method, in this case 'GetExpenseById'
            expense => CreatedAtAction(nameof(GetExpenseById), new { expenseId = expense.Id }, expense),
            errors => Problem(errors)
        );
    }

    [HttpPut("{expenseId:guid}")]
    public async Task<IActionResult> UpdateExpense(Guid expenseId, [FromBody] ExpenseUpdateDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new UpdateExpenseCommand(dto, expenseId, UserId), token);

        return result.Match(
            expense => Ok(expense),
            errors => Problem(errors)
        );
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteExpense(Guid id, CancellationToken token)
    {
        var result = await mediator.Send(new DeleteExpenseCommand(id, UserId), token);

        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
        );
    }
}
