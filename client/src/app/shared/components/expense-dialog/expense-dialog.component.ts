import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-expense-dialog',
  imports: [],
  templateUrl: './expense-dialog.component.html',
  styleUrl: './expense-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseDialogComponent {}
