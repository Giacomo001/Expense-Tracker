using System;
using System.Security.Claims;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Categories.Commands;
using ExpenseTracker.Application.Features.Categories.Queries;
using ExpenseTracker.Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration.UserSecrets;

namespace ExpenseTracker.API.Controllers;

[Authorize]
public class CategoriesController(IMediator mediator) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAllCategories(CancellationToken token)
    {
        var result = await mediator.Send(new GetAllCategoriesQuery(UserId), token);

        return result.Match(
            categories => Ok(categories),
            errors => Problem(errors)
        );
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCategoryById(Guid id, CancellationToken token)
    {
        var result = await mediator.Send(new GetCategoryByIdQuery(id, UserId), token);

        return result.Match(
            category => Ok(category),
            errors => Problem(errors)
        );
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryCreateDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new CreateCategoryCommand(dto, UserId), token);

        return result.Match(
            /*
                It gives immediately back the record created
                It returns 201 code instead of 200 (correct for a Create method)
                nameof => it avoids writing a hardcoded string that can break if it doesn't find the method
            */ 
            category => CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category),
            errors => Problem(errors)
        );
    }

    [HttpPut("{categoryId:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid categoryId, [FromBody] CategoryUpdateDto dto, CancellationToken token)
    {
        var result = await mediator.Send(new UpdateCategoryCommand(dto, categoryId, UserId), token);

        return result.Match(
            category => Ok(category),
            errors => Problem(errors)
        );
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken token)
    {
        var result = await mediator.Send(new DeleteCategoryCommand(id, UserId), token);

        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
        );
    }
}
