import { Component, Input, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoberturaInfo } from '../../services/auth.service';

export interface TopbarTab {
  key: string;
  label: string;
}

export interface TopbarNotificacion {
  id: number;
  tipo: 'por-vencer' | 'vencido' | 'evento';
  titulo: string;
  descripcion: string;
  tiempo: string;
  accion?: { vista: string; casoId?: string };
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
  @Input() notificaciones: TopbarNotificacion[] = [];

  @Output() tabChange     = new EventEmitter<string>();
  @Output() sidebarToggle = new EventEmitter<void>();
  @Output() logoutEvent   = new EventEmitter<void>();
  @Output() notifClick    = new EventEmitter<TopbarNotificacion>();
  @Output() clearNotif    = new EventEmitter<void>();

  notifOpen = signal(false);

  toggleNotif(event: Event) {
    event.stopPropagation();
    this.notifOpen.update(v => !v);
  }

  clickNotif(n: TopbarNotificacion) {
    this.notifOpen.set(false);
    if (n.accion) this.notifClick.emit(n);
  }

  @HostListener('document:click')
  onDocClick() {
    this.notifOpen.set(false);
  }

  get notifCount(): number { return this.notificaciones.length; }

  tipoLabel(tipo: TopbarNotificacion['tipo']): string {
    return tipo === 'por-vencer' ? 'Por vencer' : tipo === 'vencido' ? 'Vencido' : 'Evento hoy';
  }
}
