import { Component, Input, Output, EventEmitter, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Rol {
  id: string; nombre: string; descripcion: string;
  tipoUsuario: string; notaria: string; app: string; estado: string;
}

type Perm = { ver: boolean; crear: boolean; editar: boolean; anular: boolean };
type Permisos = Record<string, Perm>;

const MODULOS_PERMISOS = [
  { mod: 'Seguridad',                menus: ['Usuarios', 'Roles'] },
  { mod: 'Mantenimiento',            menus: ['Notarías', 'Aplicativos', 'Tablas', 'Juzgados', 'Clientes', 'Entidades', 'Etapas', 'Tipos de Caso', 'Aranceles'] },
  { mod: 'Mantenedores SGC',         menus: ['Tipo de Gasto', 'Plantillas y Cuadros'] },
  { mod: 'SGC – Dashboard',          menus: ['Dashboard de Gastos', 'Dashboard de Ingresos', 'Dashboard de Comisiones'] },
  { mod: 'SGC – Gestión Financiera', menus: ['Gestión de Ingresos', 'Solicitudes de Gasto', 'Registro de Demandas', 'Reembolso', 'Demandados'] },
  { mod: 'SGC – Comisiones',         menus: ['Gestión de Comisiones'] },
  { mod: 'SGC – Reportes',           menus: ['Reporte de Ingresos', 'Reportes de Gastos', 'Reportes de Reembolsos', 'Reporte de Comisiones'] },
  { mod: 'SPL – Dashboards',         menus: ['Dashboard de Casos Activos', 'Dashboard de Casos Concluidos', 'Dashboard Administrativo'] },
  { mod: 'SPL – Procesos',           menus: ['Casos Judiciales', 'Configuración Financiera', 'Bitácora de Casos', 'Eventos Programados', 'Casos Concluidos'] },
  { mod: 'SPL – Metas',              menus: ['Metas', 'Historial de Eficiencia'] },
  { mod: 'GEPDIA – Dashboard',                 menus: ['Dashboard'] },
  { mod: 'GEPDIA – Procesamiento Inteligente', menus: ['Consulta IA', 'Mis Documentos', 'Consultas Guardadas', 'Gestión de Documentos'] },
  { mod: 'GEPDIA – Generación de Documentos',  menus: ['Consulta de Formularios', 'Formularios', 'Gestión de Plantillas'] },
];

const DEF: Record<string, Partial<Record<string, Perm>>> = {
  'Digitador': {
    'Dashboard de Casos Activos':   { ver:true, crear:false, editar:false, anular:false },
    'Dashboard de Casos Concluidos':{ ver:true, crear:false, editar:false, anular:false },
    'Casos Judiciales':  { ver:true, crear:true,  editar:true,  anular:false },
    'Bitácora de Casos': { ver:true, crear:true,  editar:false, anular:false },
  },
  'Abogado': {
    'Dashboard de Casos Activos':   { ver:true, crear:false, editar:false, anular:false },
    'Dashboard de Casos Concluidos':{ ver:true, crear:false, editar:false, anular:false },
    'Casos Judiciales':        { ver:true, crear:true,  editar:true,  anular:false },
    'Configuración Financiera':{ ver:true, crear:false, editar:false, anular:false },
    'Bitácora de Casos':  { ver:true, crear:true,  editar:true,  anular:false },
    'Eventos Programados':{ ver:true, crear:true,  editar:true,  anular:false },
    'Dashboard de Gastos':{ ver:true, crear:false, editar:false, anular:false },
    'Solicitudes de Gasto':{ ver:true, crear:true, editar:false, anular:false },
    'Dashboard':          { ver:true, crear:false, editar:false, anular:false },
    'Consulta IA':        { ver:true, crear:false, editar:false, anular:false },
    'Mis Documentos':     { ver:true, crear:false, editar:false, anular:false },
    'Consultas Guardadas':{ ver:true, crear:false, editar:false, anular:false },
    'Gestión de Documentos':{ ver:true, crear:true, editar:false, anular:false },
  },
  'Asistente': {
    'Dashboard de Gastos':  { ver:true, crear:false, editar:false, anular:false },
    'Dashboard de Ingresos':{ ver:true, crear:false, editar:false, anular:false },
    'Solicitudes de Gasto': { ver:true, crear:true,  editar:false, anular:false },
    'Gestión de Ingresos':  { ver:true, crear:false, editar:false, anular:false },
    'Reembolso':            { ver:true, crear:false, editar:false, anular:false },
  },
  'Administrador': {
    'Usuarios':          { ver:true, crear:true, editar:true, anular:false },
    'Roles':             { ver:true, crear:true, editar:true, anular:false },
    'Notarías':          { ver:true, crear:false,editar:false,anular:false },
    'Aplicativos':       { ver:true, crear:false,editar:false,anular:false },
    'Tablas':            { ver:true, crear:true, editar:true, anular:false },
    'Juzgados':          { ver:true, crear:true, editar:true, anular:false },
    'Clientes':          { ver:true, crear:true, editar:true, anular:false },
    'Entidades':         { ver:true, crear:true, editar:true, anular:false },
    'Etapas':            { ver:true, crear:true, editar:true, anular:false },
    'Tipos de Caso':     { ver:true, crear:true, editar:true, anular:false },
    'Aranceles':         { ver:true, crear:true, editar:true, anular:false },
    'Tipo de Gasto':         { ver:true, crear:true, editar:true, anular:false },
    'Plantillas y Cuadros':  { ver:true, crear:true, editar:true, anular:false },
    'Dashboard de Casos Activos':   { ver:true, crear:false,editar:false,anular:false },
    'Dashboard de Casos Concluidos':{ ver:true, crear:false,editar:false,anular:false },
    'Dashboard Administrativo':     { ver:true, crear:false,editar:false,anular:false },
    'Casos Judiciales':      { ver:true, crear:true, editar:true, anular:true  },
    'Configuración Financiera':{ ver:true, crear:false, editar:true, anular:false },
    'Bitácora de Casos':     { ver:true, crear:true, editar:true, anular:false },
    'Eventos Programados':   { ver:true, crear:true, editar:true, anular:true  },
    'Casos Concluidos':      { ver:true, crear:false,editar:true, anular:false },
    'Metas':                 { ver:true, crear:true, editar:true, anular:true  },
    'Historial de Eficiencia':{ ver:true, crear:false,editar:false,anular:false },
    'Dashboard de Gastos':    { ver:true, crear:false,editar:false,anular:false },
    'Dashboard de Ingresos':  { ver:true, crear:false,editar:false,anular:false },
    'Dashboard de Comisiones':{ ver:true, crear:false,editar:false,anular:false },
    'Gestión de Ingresos':    { ver:true, crear:true, editar:true, anular:true  },
    'Solicitudes de Gasto':   { ver:true, crear:true, editar:true, anular:true  },
    'Registro de Demandas':   { ver:true, crear:true, editar:true, anular:true  },
    'Reembolso':              { ver:true, crear:true, editar:true, anular:true  },
    'Demandados':             { ver:true, crear:true, editar:true, anular:false },
    'Gestión de Comisiones':  { ver:true, crear:true, editar:true, anular:true  },
    'Reporte de Ingresos':    { ver:true, crear:false,editar:false,anular:false },
    'Reportes de Gastos':     { ver:true, crear:false,editar:false,anular:false },
    'Reportes de Reembolsos': { ver:true, crear:false,editar:false,anular:false },
    'Reporte de Comisiones':  { ver:true, crear:false,editar:false,anular:false },
    'Dashboard':             { ver:true, crear:false,editar:false,anular:false },
    'Consulta IA':           { ver:true, crear:true, editar:false,anular:false },
    'Mis Documentos':        { ver:true, crear:true, editar:true, anular:false },
    'Consultas Guardadas':   { ver:true, crear:true, editar:true, anular:true  },
    'Gestión de Documentos': { ver:true, crear:true, editar:true, anular:false },
    'Consulta de Formularios':{ ver:true, crear:false,editar:false,anular:false },
    'Formularios':           { ver:true, crear:true, editar:true, anular:false },
    'Gestión de Plantillas': { ver:true, crear:true, editar:true, anular:false },
  },
  'Mantenedor': {
    'Tablas':        { ver:true, crear:true, editar:true, anular:false },
    'Juzgados':      { ver:true, crear:true, editar:true, anular:false },
    'Clientes':      { ver:true, crear:true, editar:true, anular:false },
    'Entidades':     { ver:true, crear:true, editar:true, anular:false },
    'Etapas':        { ver:true, crear:true, editar:true, anular:false },
    'Tipos de Caso': { ver:true, crear:true, editar:true, anular:false },
    'Aranceles':     { ver:true, crear:true, editar:true, anular:false },
    'Tipo de Gasto':        { ver:true, crear:true, editar:true, anular:false },
    'Plantillas y Cuadros': { ver:true, crear:true, editar:true, anular:false },
    'Aplicativos':   { ver:true, crear:true, editar:true, anular:false },
    'Dashboard de Casos Activos':   { ver:true, crear:false,editar:false,anular:false },
    'Dashboard de Casos Concluidos':{ ver:true, crear:false,editar:false,anular:false },
    'Dashboard de Gastos':    { ver:true, crear:false,editar:false,anular:false },
    'Dashboard de Ingresos':  { ver:true, crear:false,editar:false,anular:false },
    'Dashboard de Comisiones':{ ver:true, crear:false,editar:false,anular:false },
  },
};

// Menús cuyas acciones de Crear/Editar/Anular no aplican (o aplican solo parcialmente).
// Si un menú no aparece aquí, se asume que Crear/Editar/Anular aplican todos.
const PERMS_LIMITADOS: Record<string, ('crear' | 'editar' | 'anular')[]> = {
  // Dashboards y reportes: solo lectura, sin acciones de escritura
  'Dashboard de Casos Activos':    [],
  'Dashboard de Casos Concluidos': [],
  'Dashboard Administrativo':      [],
  'Dashboard de Gastos':           [],
  'Dashboard de Ingresos':         [],
  'Dashboard de Comisiones':       [],
  'Dashboard':                     [],
  'Reporte de Ingresos':           [],
  'Reportes de Gastos':            [],
  'Reportes de Reembolsos':        [],
  'Reporte de Comisiones':         [],
  'Historial de Eficiencia':       [],
  'Consulta de Formularios':       [],
  // Casos particulares
  'Consulta IA':              ['crear'],  // solo puede consultar (crear consulta), no editar/anular
  'Casos Concluidos':         ['editar'], // se generan al cerrar un caso, no se crean directo; se revierten (editar)
  'Configuración Financiera': ['editar'], // solo se edita; no se crea ni se anula como entidad aparte
};

function permAplica(menu: string, perm: 'crear' | 'editar' | 'anular'): boolean {
  const limite = PERMS_LIMITADOS[menu];
  if (limite === undefined) return true;
  return limite.includes(perm);
}

function initPermisos(): Permisos {
  const p: Permisos = {};
  MODULOS_PERMISOS.forEach(m => m.menus.forEach(menu => {
    p[menu] = { ver: false, crear: false, editar: false, anular: false };
  }));
  return p;
}

function applyDefaults(tipo: string): Permisos {
  const p = initPermisos();
  const defs = DEF[tipo] ?? {};
  Object.entries(defs).forEach(([menu, perm]) => {
    if (p[menu] && perm) {
      const sane: Perm = { ...perm };
      (['crear', 'editar', 'anular'] as const).forEach(k => { if (!permAplica(menu, k)) sane[k] = false; });
      p[menu] = sane;
    }
  });
  return p;
}

@Component({
  selector: 'app-rol-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
      <div class="cfg-modal-bg-g" (click)="onClose()">
        <div class="cfg-modal-g" style="max-width:660px;max-height:92vh" (click)="$event.stopPropagation()">

          <div class="cfg-modal-title-g">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(59,130,246,.15)">
              <svg class="w-4 h-4" style="color:#3B82F6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <span>{{ modalTitle() }}</span>
            @if (isReadonly()) {
              <span style="font-size:11px;font-weight:600;background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:20px;margin-left:8px">Solo lectura</span>
            }
            <button class="ml-auto" style="color:#9CA3AF;background:none;border:none;cursor:pointer" (click)="onClose()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          @if (isReadonly()) {
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#92400E;display:flex;align-items:center;gap:8px">
              <svg style="width:16px;height:16px;flex-shrink:0;color:#D97706" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Este es un rol global del sistema. Solo puedes visualizarlo. Para crear un rol personalizado para tu notaría usa <strong>Nuevo Rol</strong>.
            </div>
          }

          <div class="grid grid-cols-2 gap-x-4">
            <div>
              <label>Nombre del Rol <span style="color:#EF4444">*</span></label>
              <input type="text" placeholder="Ej: Abogado Senior" maxlength="50" [(ngModel)]="form.nombre" [attr.readonly]="isReadonly() ? '' : null"/>
            </div>
            <div>
              <label>Tipo de Usuario <span style="color:#EF4444">*</span></label>
              <select [(ngModel)]="form.tipoUsuario" (ngModelChange)="onTipoChange($event)" [disabled]="isReadonly()">
                <option value="">Seleccionar tipo...</option>
                <option>Digitador</option><option>Abogado</option><option>Asistente</option>
                <option>Mantenedor</option><option>Administrador</option>
              </select>
            </div>
            <div>
              <label>Descripción</label>
              <input type="text" placeholder="Descripción breve" maxlength="200" [(ngModel)]="form.descripcion" [attr.readonly]="isReadonly() ? '' : null"/>
            </div>
            @if (showEstado()) {
              <div>
                <label>Estado</label>
                <select [(ngModel)]="form.estado" [disabled]="isReadonly()"><option>Activo</option><option>Inactivo</option></select>
              </div>
            }
          </div>

          <!-- Tabla de permisos -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;margin-bottom:4px">
            <p class="text-xs font-semibold uppercase tracking-wider" style="color:#6B7280;margin:0">
              Permisos del Rol
              <span class="font-normal normal-case" style="color:#9CA3AF"> (heredados según Tipo de Usuario)</span>
            </p>
            @if (!isReadonly()) {
              <button type="button" (click)="resetDefaults()"
                style="font-size:11px;color:#F47920;background:rgba(244,121,32,.08);border:1px solid rgba(244,121,32,.25);border-radius:6px;padding:3px 10px;cursor:pointer;font-weight:600">
                ↺ Restablecer defaults
              </button>
            }
          </div>
          <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;max-height:300px;overflow-y:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead>
                <tr style="background:#F9FAFB;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:1">
                  <th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6B7280;font-weight:600">Menú</th>
                  <th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6B7280;font-weight:600">Sub Menú</th>
                  <th style="text-align:center;padding:8px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6B7280;font-weight:600">Ver</th>
                  <th style="text-align:center;padding:8px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6B7280;font-weight:600">Crear</th>
                  <th style="text-align:center;padding:8px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6B7280;font-weight:600">Editar</th>
                  <th style="text-align:center;padding:8px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6B7280;font-weight:600">Anular</th>
                </tr>
              </thead>
              <tbody>
                @for (mod of MODULOS; track mod.mod) {
                  @for (menu of mod.menus; track menu; let j = $index) {
                    <tr style="border-bottom:1px solid #F3F4F6">
                      @if (j === 0) {
                        <td [attr.rowspan]="mod.menus.length" style="padding:8px 12px;font-weight:600;font-size:12px;color:#1F2937;vertical-align:top;border-right:1px solid var(--border)">{{ mod.mod }}</td>
                      }
                      <td style="padding:8px 12px;color:#6B7280;font-size:12px">{{ menu }}</td>
                      <td style="text-align:center;padding:8px 6px"><input type="checkbox" class="perm-chk" [(ngModel)]="permisos[menu].ver"    [disabled]="isReadonly()"/></td>
                      <td style="text-align:center;padding:8px 6px"><input type="checkbox" class="perm-chk" [(ngModel)]="permisos[menu].crear"  [disabled]="isReadonly() || !permAplica(menu,'crear')"/></td>
                      <td style="text-align:center;padding:8px 6px"><input type="checkbox" class="perm-chk" [(ngModel)]="permisos[menu].editar"  [disabled]="isReadonly() || !permAplica(menu,'editar')"/></td>
                      <td style="text-align:center;padding:8px 6px"><input type="checkbox" class="perm-chk" [(ngModel)]="permisos[menu].anular"  [disabled]="isReadonly() || !permAplica(menu,'anular')"/></td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <div class="flex gap-3 justify-end mt-4">
            <button class="btn-secondary" (click)="onClose()">{{ isReadonly() ? 'Cerrar' : 'Cancelar' }}</button>
            @if (!isReadonly()) {
              <button class="btn-orange" (click)="guardar()">Guardar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolModalComponent {
  @Input() visible = false;
  @Input() roles: Rol[] = [];
  @Input() notariaAdmin = '';
  @Input() esAdminSigcomt = false;

  @Output() closed  = new EventEmitter<void>();
  @Output() saved   = new EventEmitter<{ rol: Rol; isNew: boolean }>();
  @Output() toast   = new EventEmitter<string>();

  readonly MODULOS = MODULOS_PERMISOS;
  readonly permAplica = permAplica;

  modalTitle  = signal('Nuevo Rol');
  showEstado  = signal(false);
  editingId   = signal<string | null>(null);
  permisos: Permisos = initPermisos();

  form = { nombre: '', descripcion: '', tipoUsuario: '', app: 'TODOS', notaria: 'Todas', estado: 'Activo' };

  isReadonly = computed(() =>
    !this.esAdminSigcomt &&
    !!this.editingId() &&
    (this.form.notaria === 'Todas' || this.form.notaria === '')
  );

  openNew() {
    this.editingId.set(null);
    this.modalTitle.set('Nuevo Rol');
    this.showEstado.set(false);
    const notaria = (!this.esAdminSigcomt && this.notariaAdmin) ? this.notariaAdmin : 'Todas';
    this.form = { nombre: '', descripcion: '', tipoUsuario: '', app: 'TODOS', notaria, estado: 'Activo' };
    this.permisos = initPermisos();
  }

  openEdit(rol: Rol) {
    this.editingId.set(rol.id);
    this.modalTitle.set('Editar Rol');
    this.showEstado.set(true);
    this.form = { nombre: rol.nombre, descripcion: rol.descripcion, tipoUsuario: rol.tipoUsuario, app: rol.app, notaria: rol.notaria, estado: rol.estado };
    this.permisos = applyDefaults(rol.tipoUsuario);
  }

  onTipoChange(tipo: string) {
    this.permisos = applyDefaults(tipo);
  }

  resetDefaults() {
    this.permisos = applyDefaults(this.form.tipoUsuario);
  }

  guardar() {
    if (this.isReadonly()) { this.onClose(); return; }
    const f = this.form;
    if (!f.nombre || !f.tipoUsuario) { this.toast.emit('Nombre y Tipo de Usuario son obligatorios'); return; }
    if (!this.editingId()) {
      if (this.roles.find(r => r.nombre === f.nombre && r.tipoUsuario === f.tipoUsuario)) {
        this.toast.emit('Ya existe ese rol para ese tipo'); return;
      }
    }
    const rol: Rol = {
      id: this.editingId() || 'R' + String(this.roles.length + 1).padStart(3, '0'),
      ...f
    };
    this.saved.emit({ rol, isNew: !this.editingId() });
    this.onClose();
  }

  onClose() { this.closed.emit(); }
}
