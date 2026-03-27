import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

@Component({
  selector: 'app-pagging',
  standalone: true,
  imports: [NzPaginationModule],
  templateUrl: './pagging.component.html',
  styleUrl: './pagging.component.scss'
})
export class PaggingComponent {
  @Input() total = 0;
  @Input() pageIndex = 1;
  @Input() pageSize = 5;

  @Output() pageIndexChange = new EventEmitter<number>();

  get totalPages(): number {
    if (this.total === 0) {
      return 1;
    }

    return Math.ceil(this.total / this.pageSize);
  }

  get showingRecords(): number {
    if (this.total <= 0) {
      return 0;
    }
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const remaining = this.total - startIndex;
    return Math.max(Math.min(this.pageSize, remaining), 0);
  }

  onPageIndexChange(value: number): void {
    this.pageIndexChange.emit(value);
  }
}
