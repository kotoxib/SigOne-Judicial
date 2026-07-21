import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pg-bar">
      <div class="flex items-center gap-2">
        <span class="pg-info">Por página:</span>
        <select class="pg-select" [ngModel]="pageSize" (ngModelChange)="onPageSizeChange($event)">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="100">100</option>
        </select>
        <span class="pg-info">de {{ totalRecords }} registros</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="pg-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <div class="flex gap-1">
          <button class="pg-btn" [disabled]="currentPage === 1" (click)="onPrevPage()">&#8249;</button>
          <button class="pg-btn" [disabled]="currentPage >= totalPages" (click)="onNextPage()">&#8250;</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pg-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-top: 1px solid var(--border);
      gap: 16px;
      flex-wrap: wrap;
    }
    .pg-info {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
    }
    .pg-select {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #fff;
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
      transition: border-color .2s;
    }
    .pg-select:hover {
      border-color: var(--orange);
    }
    .pg-btn {
      width: 28px;
      height: 28px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: #fff;
      color: var(--text);
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all .2s;
    }
    .pg-btn:hover:not(:disabled) {
      background: var(--orange);
      border-color: var(--orange);
      color: #fff;
    }
    .pg-btn:disabled {
      opacity: .4;
      cursor: not-allowed;
    }
    .flex {
      display: flex;
    }
    .items-center {
      align-items: center;
    }
    .gap-1 {
      gap: 4px;
    }
    .gap-2 {
      gap: 8px;
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalRecords: number = 0;
  @Input() pageSize: number = 5;

  @Output() pageChanged = new EventEmitter<number>();
  @Output() pageSizeChanged = new EventEmitter<number>();

  onPrevPage(): void {
    if (this.currentPage > 1) {
      this.pageChanged.emit(this.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChanged.emit(this.currentPage + 1);
    }
  }

  onPageSizeChange(size: string | number): void {
    const newSize = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSizeChanged.emit(newSize);
  }
}
