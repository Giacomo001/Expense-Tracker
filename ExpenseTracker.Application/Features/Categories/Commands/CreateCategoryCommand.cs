using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Application.Validators;
using FluentValidation;
using MediatR;

namespace ExpenseTracker.Application.Features.Categories.Commands;

public record CreateCategoryCommand(CategoryCreateDto Dto, Guid UserId) : IRequest<ErrorOr<CategoryReadDto>>;

public class CreateCategoryHandler(
    IUnitOfWork uow, 
    IValidator<CategoryCreateDto> createValidator
) : IRequestHandler<CreateCategoryCommand, ErrorOr<CategoryReadDto>>
{
    public async Task<ErrorOr<CategoryReadDto>> Handle(CreateCategoryCommand request, CancellationToken token)
    {
        var validationResult = await createValidator.ValidateAsync(request.Dto, token);
        //If fails, it shows the errors as a list
        if(!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.PropertyName, e.ErrorMessage))
                .ToList();
        }

        var category = request.Dto.CategoryCreateToEntity(request.UserId);
        await uow.Categories.CreateCategoryAsync(category, token);
        if(!await uow.Complete(token)) return Error.Failure("Category.Create", "The creation of the category was unsuccessful.");

        return category.CategoryToReadDto();
    }
} 