using System;
using ErrorOr;
using ExpenseTracker.Application.DTOs;
using ExpenseTracker.Application.Features.Categories.Queries;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Application.Mappers;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Categories;

public class GetCategoryByIdQueryTests
{
    private readonly IUnitOfWork uow;
    private readonly GetCategoryByIdHandler sut;

    public GetCategoryByIdQueryTests()
    {
        uow = Substitute.For<IUnitOfWork>();

        sut = new GetCategoryByIdHandler(uow);
    }

    [Fact]
    public async Task GetCategoryByIdHandler_Should_ReturnNotFound_When_RecordDoesNotExist()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.Categories.GetCategoryByIdAsync(categoryId, userId, token).Returns((Category?)null);
        var query = new GetCategoryByIdQuery(categoryId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Category.NotFound");
        result.FirstError.Description.Should().Be("Category could not be found.");
    }

    [Fact]
    public async Task GetCategoryByIdHandler_Should_ReturnCategoryReadDto_When_RecordExists()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var category = new Category
        {
            Id = categoryId,
            Name = "Test",
            Color = "#000000",
            UserId = userId
        };

        var expected = new CategoryReadDto
        (
            Id: categoryId,
            Name: "Test",
            Color: "#000000"
        );

        uow.Categories.GetCategoryByIdAsync(categoryId, userId, token).Returns(category);
        var query = new GetCategoryByIdQuery(categoryId, userId);

        //Act
        var result = await sut.Handle(query, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(expected);
    }
}
