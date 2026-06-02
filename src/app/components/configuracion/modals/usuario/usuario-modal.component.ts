import {
  Component, Input, Output, EventEmitter, signal, computed,
  ChangeDetectionStrategy, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddRolModalComponent } from '../add-rol/add-rol-modal.component';
import type { RolAgregado } from '../add-rol/add-rol-modal.component';

interface RolAsignado { notaria: string; rol: string; app: string; }
export interface Usuario {
  id: string; username: string; nombres: string; apellidos: string;
  email: string; celular: string; pwd: string; notaria: string;
  roles: RolAsignado[]; estado: string; avatar: string;
  condicion: string; comision: string; tipoUsuario: string;
  abogadoAsociado: string; abogadosAsistidos: string[];
}
interface Notaria { id: string; razon: string; estado: string; }
interface Rol { id: string; nombre: string; tipoUsuario: string; app: string; estado: string; }

@Component({
  selector: 'app-usuario-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AddRolModalComponent],
  template: `
    @if (visible) {
      <div class="cfg-modal-bg-g" (click)="onClose()">
        <div class="cfg-modal-g" style="max-width:600px;max-height:90vh" (click)="$event.stopPropagation()">
          <div class="cfg-modal-title-g">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(244,121,32,.15)">
              <svg class="w-4 h-4" style="color:#F47920" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <span>{{ modalTitle() }}</span>
            <button class="ml-auto" style="color:#9CA3AF;background:none;border:none;cursor:pointer" (click)="onClose()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Avatar -->
          <div class="mb-4 flex items-center gap-4">
            <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#F47920,#D4620A);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0">
              {{ form.nombres ? iniciales(form.nombres, form.apellidos) : '?' }}
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider mb-1" style="color:#6B7280">Foto (opcional)</label>
              <input type="file" accept="image/*" class="filter-input text-xs" [disabled]="readonly()"/>
            </div>
          </div>

          <!-- Campos básicos -->
          <div class="grid grid-cols-2 gap-x-4">
            <div class="col-span-2">
              <label>Email <span style="color:#EF4444">*</span></label>
              <input type="email" placeholder="cbarrios@sigcomt.com" maxlength="50" [(ngModel)]="form.email" [disabled]="readonly()"/>
            </div>
            <div>
              <label>Nombres <span style="color:#EF4444">*</span></label>
              <input type="text" placeholder="César" maxlength="50" [(ngModel)]="form.nombres" [disabled]="readonly()"/>
            </div>
            <div>
              <label>Apellidos <span style="color:#EF4444">*</span></label>
              <input type="text" placeholder="Barrios" maxlength="50" [(ngModel)]="form.apellidos" [disabled]="readonly()"/>
            </div>
            <div>
              <label>Celular</label>
              <input type="text" placeholder="9XX XXX XXX" maxlength="15" [(ngModel)]="form.celular" [disabled]="readonly()"/>
            </div>
            @if (!readonly()) {
              <div>
                <label>Contraseña @if (!editingId()) {<span style="color:#EF4444">*</span>}</label>
                <input type="password" placeholder="••••••" maxlength="25" [(ngModel)]="form.pwd"/>
              </div>
              <div class="col-span-2">
                <label>Repite Contraseña @if (!editingId()) {<span style="color:#EF4444">*</span>}</label>
                <input type="password" placeholder="••••••" maxlength="25" [(ngModel)]="form.pwd2"/>
              </div>
            }
            @if (showEstado()) {
              <div class="col-span-2">
                <label>Estado</label>
                <select [(ngModel)]="form.estado" [disabled]="readonly()">
                  <option>Activo</option><option>Inactivo</option>
                </select>
              </div>
            }
          </div>

          <!-- Tipo / condición / comisión -->
          <div class="grid grid-cols-2 gap-x-4 mt-1">
            <div>
              <label>Tipo de usuario</label>
              <input type="text" [value]="form.tipoUsuario || 'Se asigna según el rol'" readonly style="background:#f9fafb;color:#6b7280;cursor:default"/>
            </div>
            @if (showCondicion()) {
              <div>
                <label>Condición laboral <span style="color:#EF4444">*</span></label>
                <select [(ngModel)]="form.condicion" (ngModelChange)="syncFlags()" [disabled]="readonly()">
                  <option value="">— Seleccionar —</option>
                  <option value="Interno">Interno</option>
                  <option value="Externo">Externo</option>
                </select>
              </div>
            }
            @if (showComision()) {
              <div>
                <label>Comisión (%)</label>
                <input type="number" min="0" max="100" step="0.1" placeholder="3" [(ngModel)]="form.comision" [disabled]="readonly()"/>
              </div>
            }
            @if (showAbogado()) {
              <div class="col-span-2">
                <label>Abogados a asistir <span style="color:#EF4444">*</span></label>
                <div style="border:1px solid #E5E7EB;border-radius:8px;padding:8px 10px;max-height:120px;overflow-y:auto;background:#FAFAFA">
                  @if (!abogadosPorNotaria().length) {
                    <span style="font-size:12px;color:#9CA3AF">No hay abogados disponibles</span>
                  }
                  @for (a of abogadosPorNotaria(); track a.id) {
                    <label style="display:flex;align-items:center;gap:8px;padding:4px 2px;cursor:pointer;font-size:13px;color:#374151">
                      <input type="checkbox"
                        [checked]="abogadosAsistidos().includes(a.id)"
                        (change)="toggleAbogado(a.id)"
                        [disabled]="readonly()"
                        style="width:14px;height:14px;accent-color:#F47920"/>
                      <span>{{ a.nombres }} {{ a.apellidos }}</span>
                      <span style="font-size:11px;color:#9CA3AF;margin-left:auto">{{ a.roles[0]?.rol ?? '' }}</span>
                    </label>
                  }
                </div>
                @if (abogadosAsistidos().length) {
                  <p style="font-size:11px;color:#F47920;margin-top:4px">{{ abogadosAsistidos().length }} abogado(s) seleccionado(s)</p>
                }
              </div>
            }
          </div>

          <!-- Roles -->
          <div class="mt-4">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-semibold uppercase tracking-wider" style="color:#6B7280">Roles asignados</p>
              @if (!readonly()) {
                <button class="btn-orange" style="padding:6px 12px;font-size:12px" (click)="abrirAddRol()">+ Añadir Rol</button>
              }
            </div>
            <div style="min-height:40px;border:1px solid #E5E7EB;border-radius:8px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px">
              @if (!rolesTemp().length) { <span style="font-size:12px;color:#6B7280">Sin roles asignados</span> }
              @for (r of rolesTemp(); track $index; let i = $index) {
                <span style="display:inline-flex;align-items:center;background:rgba(244,121,32,.12);color:#F47920;border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600;gap:4px">
                  {{ r.notaria }} · {{ r.rol }}
                  @if (!readonly()) {
                    <button style="background:none;border:none;cursor:pointer;font-size:14px;color:#F47920;line-height:1" (click)="quitarRol(i)">×</button>
                  }
                </span>
              }
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 justify-end mt-4">
            <button class="btn-secondary" (click)="onClose()">Cancelar</button>
            @if (!readonly()) {
              <button class="btn-orange" (click)="guardar()">Guardar</button>
            }
          </div>
        </div>
      </div>

      <!-- Add-Rol modal embebido -->
      <app-add-rol-modal
        [visible]="addRolVisible()"
        [notariasActivas]="notariasActivas"
        [roles]="roles"
        [emailUsuario]="form.email"
        (closed)="addRolVisible.set(false)"
        (rolAgregado)="onRolAgregado($event)">
      </app-add-rol-modal>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioModalComponent {
  @Input() visible = false;
  @Input() usuarios: Usuario[] = [];
  @Input() notariasActivas: Notaria[] = [];
  @Input() roles: Rol[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ usuario: Usuario; isNew: boolean }>();
  @Output() toast = new EventEmitter<string>();

  // Estado interno
  editingId = signal<string | null>(null);
  readonly = signal(false);
  modalTitle = signal('Nuevo Usuario');
  showEstado = signal(false);
  showCondicion = signal(false);
  showComision = signal(false);
  showAbogado = signal(false);
  rolesTemp = signal<RolAsignado[]>([]);
  abogadosAsistidos = signal<string[]>([]);
  addRolVisible = signal(false);

  form = {
    email: '', nombres: '', apellidos: '', celular: '',
    pwd: '', pwd2: '', estado: 'Activo',
    condicion: '', comision: '3', tipoUsuario: '', abogadoAsociado: ''
  };

  abogadosPorNotaria = computed(() => {
    const notaria = this.rolesTemp()[0]?.notaria ?? '';
    return this.usuarios.filter(u =>
      u.tipoUsuario === 'Abogado' && u.estado === 'Activo' &&
      (notaria === 'Todas' || u.notaria === notaria || u.notaria === 'Todas') &&
      u.id !== this.editingId()
    );
  });

  openNew() {
    this.editingId.set(null);
    this.readonly.set(false);
    this.modalTitle.set('Nuevo Usuario');
    this.showEstado.set(false);
    this.rolesTemp.set([]);
    this.abogadosAsistidos.set([]);
    this.form = { email: '', nombres: '', apellidos: '', celular: '', pwd: '', pwd2: '', estado: 'Activo', condicion: '', comision: '3', tipoUsuario: '', abogadoAsociado: '' };
    this.syncFlags();
  }

  openEdit(u: Usuario) {
    this.editingId.set(u.id);
    this.readonly.set(false);
    this.modalTitle.set('Editar Usuario');
    this.showEstado.set(true);
    this.form = { email: u.email, nombres: u.nombres, apellidos: u.apellidos, celular: u.celular, pwd: '', pwd2: '', estado: u.estado, condicion: u.condicion, comision: u.comision, tipoUsuario: u.tipoUsuario, abogadoAsociado: u.abogadoAsociado };
    this.rolesTemp.set(u.roles.map(r => ({ ...r })));
    this.abogadosAsistidos.set([...(u.abogadosAsistidos ?? [])]);
    this.syncFlags();
  }

  openView(u: Usuario) { this.openEdit(u); this.modalTitle.set('Detalle Usuario'); this.readonly.set(true); }

  syncFlags() {
    const tipo = this.form.tipoUsuario;
    this.showCondicion.set(tipo === 'Abogado');
    this.showComision.set(tipo === 'Abogado' && this.form.condicion === 'Externo');
    this.showAbogado.set(tipo === 'Asistente');
  }

  toggleAbogado(id: string) {
    this.abogadosAsistidos.update(arr => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  }

  quitarRol(i: number) { this.rolesTemp.update(arr => arr.filter((_, idx) => idx !== i)); this.syncFlags(); }

  abrirAddRol() { this.addRolVisible.set(true); }

  onRolAgregado(evt: RolAgregado) {
    if (this.rolesTemp().find(r => r.notaria === evt.notaria && r.rol === evt.rol)) {
      this.toast.emit('Ese rol ya fue añadido'); return;
    }
    this.rolesTemp.update(arr => [...arr, { notaria: evt.notaria, rol: evt.rol, app: evt.app }]);
    if (this.rolesTemp().length === 1) { this.form.tipoUsuario = evt.tipoUsuario; this.syncFlags(); }
    this.addRolVisible.set(false);
  }

  guardar() {
    const f = this.form;
    if (!f.email || !f.nombres || !f.apellidos) { this.toast.emit('Completa los campos obligatorios'); return; }
    if (!this.editingId() && !f.pwd) { this.toast.emit('La contraseña es requerida'); return; }
    if (f.pwd && f.pwd !== f.pwd2) { this.toast.emit('Las contraseñas no coinciden'); return; }
    if (f.pwd && f.pwd.length < 6) { this.toast.emit('Mínimo 6 caracteres'); return; }
    if (!this.rolesTemp().length) { this.toast.emit('Añade al menos un rol'); return; }

    const prevPwd = this.usuarios.find(u => u.id === this.editingId())?.pwd ?? '';
    const usuario: Usuario = {
      id: this.editingId() || 'U' + String(this.usuarios.length + 1).padStart(3, '0'),
      username: f.email.split('@')[0],
      email: f.email, nombres: f.nombres, apellidos: f.apellidos, celular: f.celular,
      pwd: f.pwd ? btoa(f.pwd) : prevPwd,
      estado: f.estado,
      condicion: f.tipoUsuario === 'Abogado' ? f.condicion : '',
      comision: f.tipoUsuario === 'Abogado' && f.condicion === 'Externo' ? f.comision : '',
      tipoUsuario: f.tipoUsuario,
      abogadoAsociado: f.tipoUsuario === 'Asistente' ? f.abogadoAsociado : '',
      abogadosAsistidos: f.tipoUsuario === 'Asistente' ? [...this.abogadosAsistidos()] : [],
      notaria: this.rolesTemp()[0]?.notaria || '',
      roles: [...this.rolesTemp()],
      avatar: ''
    };

    this.saved.emit({ usuario, isNew: !this.editingId() });
    this.onClose();
  }

  iniciales(n: string, a: string): string {
    return ((n?.[0] ?? '?') + (a?.[0] ?? '?')).toUpperCase();
  }

  onClose() { this.closed.emit(); }
}
