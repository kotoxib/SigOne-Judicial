import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent {
  @Input() moduleIcon: string = '';
  @Input() moduleName: string = '';
  @Input() expanded: boolean = false;
  @Output() toggle = new EventEmitter<void>();

  onHover(state: boolean): void {
    this.expanded = state;
  }
}
