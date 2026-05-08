using System;
using System.Security.Claims;
using ExpenseTracker.Application.Features.Reports.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.API.Controllers;

[Authorize]
public class ReportsController(IMediator mediator) : BaseApiController
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetSummary([FromBody] DateOnly from, [FromBody] DateOnly to, CancellationToken token)
    {
        var result = await mediator.Send(new GetExpensesSummaryQuery(UserId, from, to), token);

        return result.Match(
            summary => Ok(summary),
            errors => Problem(errors)
        );
    }
}
