import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoberturaInfo } from '../../services/auth.service';

export interface TopbarTab {
  key: string;
  label: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  @Input() tabs: TopbarTab[] = [];
  @Input() activeTab: string = '';
  @Input() userName: string = 'Usuario';
  @Input() coberturaActiva: CoberturaInfo | null = null;

  @Output() tabChange = new EventEmitter<string>();
  @Output() sidebarToggle = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();
}
