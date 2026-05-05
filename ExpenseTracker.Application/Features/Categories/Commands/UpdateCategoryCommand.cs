using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using FluentValidation;
using MediatR;

namespace ExpenseTracker.Application.Features.Categories.Commands;

public record UpdateCategoryCommand(CategoryUpdateDto Dto, Guid CategoryId, Guid UserId) : IRequest<ErrorOr<CategoryReadDto>>;

public class UpdateCategoryHandler(
    IUnitOfWork uow,
    IValidator<CategoryUpdateDto> updateValidator
) : IRequestHandler<UpdateCategoryCommand, ErrorOr<CategoryReadDto>>
{
    public async Task<ErrorOr<CategoryReadDto>> Handle(UpdateCategoryCommand request, CancellationToken token)
    {
        var validationResult = await updateValidator.ValidateAsync(request.Dto, token);
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.ErrorCode, e.ErrorMessage))
                .ToList();
        }

        var categoryDb = await uow.Categories.GetCategoryByIdAsync(request.CategoryId, request.UserId, token);
        if(categoryDb is null) return Error.NotFound("Category.NotFound", "Category was not found");

        request.Dto.CategoryUpdateEntity(categoryDb);
        //Since categoryDb was initialized by EF - and so it's tracked - the update is automatic
        if(!await uow.Complete(token)) return Error.Failure("Category.Failure", "The update was unsuccessful.");

        return categoryDb.CategoryToReadDto();
    }
};
