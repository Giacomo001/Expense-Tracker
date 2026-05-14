import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-expenses',
  imports: [],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent {}
