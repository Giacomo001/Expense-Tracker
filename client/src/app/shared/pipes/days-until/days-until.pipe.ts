import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'daysUntil',
  standalone: true,
  pure: true
})
export class DaysUntilPipe implements PipeTransform {
  transform(date: string | null | undefined): number | null {
    if(!date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
