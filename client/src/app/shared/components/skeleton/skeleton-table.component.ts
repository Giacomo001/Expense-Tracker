import { Component, computed, input } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
  templateUrl: './skeleton-table.component.html',
  styleUrl: './skeleton-table.component.scss',
})
export class SkeletonTableComponent {
  //INPUTS
  columns = input<number>(5);
  rows = input<number>(5);

  //COMPUTED
  //To use the Skeleton, the array should be filled even though with NULL values
  protected rowsArray = computed(() => Array(this.rows()).fill(null));
  protected columnsArray = computed(() => Array(this.columns() + 1).fill(null)); //+1 = colonna Actions
  protected precomputedWidths = computed(() => {
    const widths = ['40%', '55%', '65%', '75%', '85%'];
    return Array(this.rows()).fill(null).map(() =>
      Array(this.columns() + 1).fill(null).map(() =>
        widths[Math.floor(Math.random() * widths.length)]
      )
    );
  });

  //METHODS
  //Random widths to simulate a real context making the Skeleton more believable
  protected getRandomWidth(): string {
    const widths = ['40%', '55%', '65%', '75%', '85%'];
    return widths[Math.floor(Math.random() * widths.length)];
  }
}
