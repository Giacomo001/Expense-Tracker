using System;
using ErrorOr;
using ExpenseTracker.Application.Features.Categories.Commands;
using ExpenseTracker.Application.Interfaces.Repositories;
using ExpenseTracker.Domain.Entities;
using FluentAssertions;
using NSubstitute;

namespace ExpenseTracker.Tests.Features.Categories;

public class DeleteCategoryCommandTests
{
    private readonly IUnitOfWork uow;
    private readonly DeleteCategoryHandler sut;

    public DeleteCategoryCommandTests()
    {
        uow = Substitute.For<IUnitOfWork>();
        sut = new DeleteCategoryHandler(uow);
    }

    [Fact]
    public async Task DeleteCategoryCommand_Should_ReturnNotFoundError_When_RecordDoesNotExist()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        uow.Categories.GetCategoryByIdAsync(categoryId, userId, token).Returns((Category)null!);
        var command = new DeleteCategoryCommand(categoryId, userId);

        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("Category.NotFound");
        result.FirstError.Description.Should().Be("The category was not found.");
        uow.Categories.DidNotReceive().DeleteCategory(Arg.Any<Category>());
        await uow.DidNotReceive().Complete(token);
    }

    [Fact]
    public async Task DeleteCategoryCommand_Should_ReturnFailureError_When_DeleteUnsuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var entity = new Category
        {
            Id = categoryId,
            Name = "Test",
            UserId = userId
        };

        uow.Categories.GetCategoryByIdAsync(categoryId, userId, token).Returns(entity);
        var command = new DeleteCategoryCommand(categoryId, userId);
        uow.Complete(token).Returns(false);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Failure);
        result.FirstError.Code.Should().Be("Category.Failure");
        result.FirstError.Description.Should().Be("There was a problem and the category could not be deleted.");
        uow.Categories.Received(1).DeleteCategory(Arg.Any<Category>());
        await uow.Received(1).Complete(token);
    }

    [Fact]
    public async Task DeleteCategoryCommand_Should_ReturnDeleted_When_DeleteSuccessful()
    {
        //Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var token = CancellationToken.None;

        var entity = new Category
        {
            Id = categoryId,
            Name = "Test",
            UserId = userId
        };

        uow.Categories.GetCategoryByIdAsync(categoryId, userId, token).Returns(entity);
        var command = new DeleteCategoryCommand(categoryId, userId);
        uow.Complete(token).Returns(true);
        
        //Act
        var result = await sut.Handle(command, token);

        //Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Deleted);
        uow.Categories.Received(1).DeleteCategory(Arg.Any<Category>());
        await uow.Received(1).Complete(token);
    }
}
