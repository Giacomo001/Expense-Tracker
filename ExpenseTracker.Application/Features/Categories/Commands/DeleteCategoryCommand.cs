using System;
using ErrorOr;
using ExpenseTracker.Application.Interfaces.Repositories;
using MediatR;

namespace ExpenseTracker.Application.Features.Categories.Commands;

public record DeleteCategoryCommand(Guid CategoryId, Guid UserId) : IRequest<ErrorOr<Deleted>>;

public class DeleteCategoryHandler(IUnitOfWork uow) : IRequestHandler<DeleteCategoryCommand, ErrorOr<Deleted>>
{
    public async Task<ErrorOr<Deleted>> Handle(DeleteCategoryCommand request, CancellationToken token)
    {
        var categoryDb = await uow.Categories.GetCategoryByIdAsync(request.CategoryId, request.UserId, token);
        if(categoryDb is null) return Error.NotFound("Category.NotFound", "The category was not found.");

        uow.Categories.DeleteCategory(categoryDb);
        if(!await uow.Complete(token)) return Error.Failure("Category.Failure", "There was a problem and the category could not be deleted.");

        return Result.Deleted;
    }
};