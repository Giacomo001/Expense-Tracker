using System;
using ExpenseTracker.Domain.Entities;
using ExpenseTracker.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpenseTracker.Infrastructure.Persistence.Configurations;

public class ExpenseConfigurations : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Amount)
            .IsRequired()
            .HasPrecision(18, 2);
        
        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.Date)
            .IsRequired();
        
        builder.Property(e => e.CreatedAt)
            .IsRequired();
        
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Category>(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
