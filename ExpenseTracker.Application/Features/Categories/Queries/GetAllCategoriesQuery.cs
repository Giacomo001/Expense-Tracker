using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using MediatR;

namespace ExpenseTracker.Application.Features.Categories.Queries;

//Represents a query to retrieve all categories belonging to a specific user
public record GetAllCategoriesQuery(Guid UserId) : IRequest<ErrorOr<IReadOnlyList<CategoryReadDto>>>;

//Handles the GetAllCategoriesQuery and returns a read-only list of CategoryReadDto
public class GetAllCategoriesHandler(IUnitOfWork uow) : IRequestHandler<GetAllCategoriesQuery, ErrorOr<IReadOnlyList<CategoryReadDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<CategoryReadDto>>> Handle(
        GetAllCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        //Fetches all categories for the given user from the repository
        var categories = await uow.Categories.GetAllCategoriesByUserIdAsync(request.UserId, cancellationToken);

        //Maps domain entities to read DTOs and returns as a read-only list
        return categories
            .Select(c => c.CategoryToReadDto())
            .ToList()
            .AsReadOnly();
    }
}