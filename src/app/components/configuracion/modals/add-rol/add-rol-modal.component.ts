import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Notaria { id: string; razon: string; estado: string; }
interface Rol { id: string; nombre: string; tipoUsuario: string; app: string; estado: string; }
export interface RolAgregado { notaria: string; rol: string; app: string; tipoUsuario: string; }

@Component({
  selector: 'app-add-rol-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
      <div class="cfg-modal-bg-g z-top" (click)="onClose()">
        <div class="cfg-modal-g" style="max-width:380px" (click)="$event.stopPropagation()">
          <div class="cfg-modal-title-g">
            Añadir Rol
            <button class="ml-auto" style="color:#9CA3AF;background:none;border:none;cursor:pointer" (click)="onClose()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div>
            <label>Notaría <span style="color:#EF4444">*</span></label>
            <select [ngModel]="notariaSel" (ngModelChange)="onNotariaChange($event)">
              <option value="">Seleccionar notaría...</option>
              @for (n of notariasActivas; track n.id) {
                <option [value]="n.razon">{{ n.razon }}</option>
              }
              <option value="Todas">Todas</option>
            </select>
          </div>
          <div>
            <label>Rol <span style="color:#EF4444">*</span></label>
            <select [(ngModel)]="rolSel">
              <option value="">Seleccionar rol...</option>
              @for (r of rolesFiltrados(); track r.id) {
                <option [value]="r.nombre">{{ r.nombre }}</option>
              }
            </select>
          </div>
          <div class="flex gap-3 justify-end mt-2">
            <button class="btn-secondary" (click)="onClose()">Cancelar</button>
            <button class="btn-orange" (click)="confirmar()">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddRolModalComponent {
  @Input() visible = false;
  @Input() notariasActivas: Notaria[] = [];
  @Input() roles: Rol[] = [];
  @Input() emailUsuario = '';

  @Output() closed = new EventEmitter<void>();
  @Output() rolAgregado = new EventEmitter<RolAgregado>();

  notariaSel = '';
  rolSel = '';

  rolesFiltrados = signal<Rol[]>([]);

  onNotariaChange(val: string) {
    this.notariaSel = val;
    this.rolSel = '';
    this.rolesFiltrados.set(this.roles.filter(r => r.estado === 'Activo'));
  }

  open() {
    this.notariaSel = '';
    this.rolSel = '';
    this.rolesFiltrados.set(this.roles.filter(r => r.estado === 'Activo'));
  }

  confirmar() {
    if (!this.notariaSel || !this.rolSel) { alert('Selecciona notaría y rol'); return; }
    if (this.rolSel === 'Administrador Sigcomt' && !this.emailUsuario.toLowerCase().endsWith('@sigcomt.com')) {
      alert('El rol "Administrador Sigcomt" solo puede asignarse a usuarios con correo @sigcomt.com');
      return;
    }
    const rol = this.roles.find(r => r.nombre === this.rolSel);
    if (!rol) return;
    this.rolAgregado.emit({ notaria: this.notariaSel, rol: this.rolSel, app: rol.app, tipoUsuario: rol.tipoUsuario });
    this.onClose();
  }

  onClose() { this.closed.emit(); }
}
