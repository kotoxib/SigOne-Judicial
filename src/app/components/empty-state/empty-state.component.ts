import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  // Nombres usados en SPJ (title / description / ctaText)
  @Input() title: string        = '';
  @Input() description: string  = '';
  @Input() ctaText: string      = '';
  @Input() ctaIcon: string      = '';
  @Input() icon: string         = '';
  @Input() helpTitle: string    = '';
  @Input() helpText: string     = '';

  // Nombres alternativos (compatibilidad con otros usos)
  @Input() titulo: string       = 'Sin registros aún';
  @Input() descripcion: string  = 'Configura los datos base para comenzar a usar este módulo.';
  @Input() labelBoton: string   = 'Comenzar configuración';
  @Input() mostrarBoton: boolean = true;

  // Salidas: onCreate (SPJ) y accion (otros)
  @Output() onCreate = new EventEmitter<void>();
  @Output() accion   = new EventEmitter<void>();

  get tituloFinal()      { return this.title      || this.titulo; }
  get descripcionFinal() { return this.description || this.descripcion; }
  get botonLabel()       { return this.ctaText     || this.labelBoton; }
  get mostrarCta()       { return this.mostrarBoton || !!this.ctaText; }

  onClickCta() {
    this.onCreate.emit();
    this.accion.emit();
  }
}
