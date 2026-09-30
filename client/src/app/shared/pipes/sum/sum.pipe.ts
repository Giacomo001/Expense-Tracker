import { Pipe, PipeTransform } from '@angular/core';
import { ExpenseRead } from '@features/expenses/models/expense.model';

@Pipe({
  name: 'sum',
  standalone: true
})
export class SumPipe implements PipeTransform {
  transform(expenses: ExpenseRead[], categoryId?: string): number {
    if (!expenses?.length) return 0;
    
    const filtered = categoryId
      ? expenses.filter(e => e.categoryId === categoryId)
      : expenses;

    return filtered.reduce((total, e) => total + e.amount, 0);
  }
}
