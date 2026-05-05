using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Domain.Entities;
using MediatR;

namespace ExpenseTracker.Application.Features.Categories.Queries;

public record GetCategoryByIdQuery(Guid CategoryId, Guid UserId) : IRequest<ErrorOr<CategoryReadDto>>;

public class GetCategoryByIdHandler(IUnitOfWork uow) : IRequestHandler<GetCategoryByIdQuery, ErrorOr<CategoryReadDto>>
{
    public async Task<ErrorOr<CategoryReadDto>> Handle(GetCategoryByIdQuery request, CancellationToken token)
    {
        var category = await uow.Categories.GetCategoryByIdAsync(request.CategoryId, request.UserId, token);
        if(category is null) return Error.NotFound("Category.NotFound", "Category could not be found.");

        return category.CategoryToReadDto();
    }
}