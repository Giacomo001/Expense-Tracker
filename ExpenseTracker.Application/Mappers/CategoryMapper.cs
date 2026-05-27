using System;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Application.Utils;

namespace ExpenseTracker.Application.Mappers;

public static class CategoryMapper
{
    public static CategoryReadDto CategoryToReadDto(this Category category)
    {
        return new CategoryReadDto
        (
            Id: category.Id,
            Name: category.Name,
            Color: category.Color
        );
    }

    public static Category CategoryCreateToEntity(this CategoryCreateDto category, Guid userId)
    {
        return new Category
        {
            Id = Guid.NewGuid(),
            Name = category.Name,
            UserId = userId,
            Color = ColorGeneratorService.Generate()
        };
    }

    public static void CategoryUpdateEntity(this CategoryUpdateDto categoryDto, Category category)
    {
        if(categoryDto.Name is not null) category.Name = categoryDto.Name;
    }
}
