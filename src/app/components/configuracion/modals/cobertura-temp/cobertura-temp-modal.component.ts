import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Usuario { id: string; nombres: string; apellidos: string; roles: { rol: string }[]; }
export interface CoberturaTemp { id: string; usuarioId: string; usuarioCubiertoId: string; usuarioCubiertoNombre: string; motivo: string; fechaInicio: string; fechaFin: string; }

@Component({
  selector: 'app-cobertura-temp-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
      <div class="cfg-modal-bg-g" (click)="onClose()">
        <div class="cfg-modal-g" style="max-width:480px" (click)="$event.stopPropagation()">
          <div class="cfg-modal-title-g">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(139,92,246,.15)">
              <svg class="w-4 h-4" style="color:#8B5CF6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span>Cobertura Temporal</span>
            <button class="ml-auto" style="color:#9CA3AF;background:none;border:none;cursor:pointer" (click)="onClose()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <p class="text-sm mb-4" style="color:#6B7280">
            Permite que <strong>{{ targetLabel }}</strong> cubra temporalmente los casos de otro usuario durante su ausencia.
          </p>

          @if (coberturas.filter(c => c.usuarioId === targetId).length) {
            <div class="mb-4 p-3 rounded-xl" style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.2)">
              <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#8B5CF6">Coberturas registradas</p>
              @for (c of coberturas.filter(co => co.usuarioId === targetId); track c.id) {
                <div class="flex items-center justify-between py-1.5" style="border-bottom:1px solid rgba(139,92,246,.12)">
                  <div>
                    <span style="font-size:12px;font-weight:600;color:#374151">{{ c.usuarioCubiertoNombre }}</span>
                    <span style="font-size:11px;color:#9CA3AF;margin-left:6px">{{ c.motivo }}</span>
                    <div style="font-size:11px;color:#8B5CF6">{{ c.fechaInicio }} → {{ c.fechaFin }}</div>
                  </div>
                  <button (click)="eliminar(c.id)" style="background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:4px;color:#EF4444;font-size:11px">Eliminar</button>
                </div>
              }
            </div>
          }

          <div style="border-top:1px solid #F3F4F6;padding-top:12px">
            <p class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#6B7280">Nueva cobertura</p>
          </div>
          <div>
            <label>Usuario a cubrir <span style="color:#EF4444">*</span></label>
            <select [(ngModel)]="form.usuarioCubiertoId">
              <option value="">— Seleccionar usuario —</option>
              @for (u of usuariosPorNotaria; track u.id) {
                <option [value]="u.id">{{ u.nombres }} {{ u.apellidos }} · {{ u.roles[0]?.rol ?? '' }}</option>
              }
            </select>
          </div>
          <div>
            <label>Motivo <span style="color:#EF4444">*</span></label>
            <select [(ngModel)]="form.motivo">
              <option value="">— Seleccionar —</option>
              <option>Vacaciones</option>
              <option>Maternidad / Paternidad</option>
              <option>Permiso de salud</option>
              <option>Permiso personal</option>
              <option>Licencia</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-x-4">
            <div><label>Fecha inicio <span style="color:#EF4444">*</span></label><input type="date" [(ngModel)]="form.fechaInicio"/></div>
            <div><label>Fecha fin <span style="color:#EF4444">*</span></label><input type="date" [(ngModel)]="form.fechaFin"/></div>
          </div>
          <p class="text-xs mt-2" style="color:#9CA3AF">Al iniciar sesión dentro de este período, el sistema ofrecerá cubrir los casos del usuario seleccionado.</p>
          <div class="flex gap-3 justify-end mt-4">
            <button class="btn-secondary" (click)="onClose()">Cerrar</button>
            <button class="btn-orange" (click)="registrar()">Registrar Cobertura</button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoberturaTempModalComponent {
  @Input() visible = false;
  @Input() targetId: string | null = null;
  @Input() targetLabel = '';
  @Input() coberturas: CoberturaTemp[] = [];
  @Input() usuariosPorNotaria: Usuario[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() coberturaRegistrada = new EventEmitter<Omit<CoberturaTemp, 'id'>>();
  @Output() coberturaEliminada = new EventEmitter<string>();

  form = { usuarioCubiertoId: '', motivo: '', fechaInicio: '', fechaFin: '' };

  open() {
    const hoy = new Date().toISOString().split('T')[0];
    this.form = { usuarioCubiertoId: '', motivo: '', fechaInicio: hoy, fechaFin: '' };
  }

  eliminar(id: string) { this.coberturaEliminada.emit(id); }

  registrar() {
    const f = this.form;
    if (!f.usuarioCubiertoId) { alert('Selecciona el usuario a cubrir'); return; }
    if (!f.motivo) { alert('Selecciona el motivo'); return; }
    if (!f.fechaInicio || !f.fechaFin) { alert('Ingresa el rango de fechas'); return; }
    if (f.fechaFin < f.fechaInicio) { alert('La fecha fin debe ser posterior al inicio'); return; }
    const cubierto = this.usuariosPorNotaria.find(u => u.id === f.usuarioCubiertoId);
    if (!cubierto) return;
    this.coberturaRegistrada.emit({
      usuarioId: this.targetId!,
      usuarioCubiertoId: f.usuarioCubiertoId,
      usuarioCubiertoNombre: cubierto.nombres + ' ' + cubierto.apellidos,
      motivo: f.motivo,
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin
    });
    this.onClose();
  }

  onClose() { this.closed.emit(); }
}
