using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTracker.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddedRecurringExpenseTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_RecurringExpense_RecurringExpenseId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_RecurringExpense_AspNetUsers_UserId",
                table: "RecurringExpense");

            migrationBuilder.DropForeignKey(
                name: "FK_RecurringExpense_Categories_CategoryId",
                table: "RecurringExpense");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RecurringExpense",
                table: "RecurringExpense");

            migrationBuilder.RenameTable(
                name: "RecurringExpense",
                newName: "RecurringExpenses");

            migrationBuilder.RenameIndex(
                name: "IX_RecurringExpense_UserId",
                table: "RecurringExpenses",
                newName: "IX_RecurringExpenses_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_RecurringExpense_CategoryId",
                table: "RecurringExpenses",
                newName: "IX_RecurringExpenses_CategoryId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RecurringExpenses",
                table: "RecurringExpenses",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_RecurringExpenses_RecurringExpenseId",
                table: "Expenses",
                column: "RecurringExpenseId",
                principalTable: "RecurringExpenses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RecurringExpenses_AspNetUsers_UserId",
                table: "RecurringExpenses",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RecurringExpenses_Categories_CategoryId",
                table: "RecurringExpenses",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_RecurringExpenses_RecurringExpenseId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_RecurringExpenses_AspNetUsers_UserId",
                table: "RecurringExpenses");

            migrationBuilder.DropForeignKey(
                name: "FK_RecurringExpenses_Categories_CategoryId",
                table: "RecurringExpenses");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RecurringExpenses",
                table: "RecurringExpenses");

            migrationBuilder.RenameTable(
                name: "RecurringExpenses",
                newName: "RecurringExpense");

            migrationBuilder.RenameIndex(
                name: "IX_RecurringExpenses_UserId",
                table: "RecurringExpense",
                newName: "IX_RecurringExpense_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_RecurringExpenses_CategoryId",
                table: "RecurringExpense",
                newName: "IX_RecurringExpense_CategoryId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RecurringExpense",
                table: "RecurringExpense",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_RecurringExpense_RecurringExpenseId",
                table: "Expenses",
                column: "RecurringExpenseId",
                principalTable: "RecurringExpense",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RecurringExpense_AspNetUsers_UserId",
                table: "RecurringExpense",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RecurringExpense_Categories_CategoryId",
                table: "RecurringExpense",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
