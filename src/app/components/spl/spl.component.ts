import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent, TopbarTab, TopbarNotificacion } from '../topbar/topbar.component';
import { ProductTourComponent } from '../product-tour/product-tour.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
declare var Chart: any;


// ─── Data types ───────────────────────────────────────────────────────────────

export interface AbogadoStat {
  semaforo: 'verde' | 'amarillo' | 'rojo';
  nombre: string;
  pct: number;
}

export interface ActualizacionAbogado {
  semaforo: 'verde' | 'amarillo' | 'rojo';
  nombre: string;
  procesos: number;
  actualizados: number;
  pct: string;
  badgeClass: string;

}

export interface BitacoraSemanal {
  nroCaso: string;
  abogado: string;
  etapa: string;
  etapaBadge: string;
  fecha: string;
}

export interface CasoConcluido {
  nroCaso: string;
  abogado: string;
  tipo: string;
  motivoCierre: string;
  motivoBadge: string;
  fechaCierre: string;
  estadoFile: string;
  fileBadge: string;
}

export interface GastoResumen {
  nroCaso: string;
  abogado: string;
  categoria: string;
  gastoTotal: string;
  estado: string;
  estadoBadge: string;
  montoAprobado: string;
  montoClass: string;
}

export interface CasoJudicial {
  starred: boolean;
  nroCaso: string;
  nroFile: string;
  abogado: string;
  cliente: string;
  entidad: 'Banco' | 'Empresa' | 'Natural';
  tipo: string;
  tipoBadge: string;
  etapa: string;
  estado: string;
  estadoBadge: string;
  pct: number;
  semaforoCls: string;
  financiero: string;
  financieroBadge: string;
  plazo: string;
  plazoClass: string;
}

export interface BitacoraRow {
  nroCaso: string;
  nroFile: string;
  nroJuicio: string;
  abogado: string;
  funcionario: string;
  entidad: string;
  clienteNombre: string;
  tipo: 'banco' | 'empresa' | 'natural';
  cuenta: string | null;
  tipoProceso: string;
  juzgado: string;
  expediente: string;
  etapa: string;
  subEstado: string;
  estado: string;
  estadoBadge: string;
  creadoPor: string;
  fechaAsignacion: string;
  fechaActoPrep: string;
  montoDemanda: string;
  plazo: string;
  plazoClass: string;
  ultimaAct: string;
  entradas: number;
  infoAdicionalTipo: string;
  infoAdicionalDesc: string;
  motivoCierre?: string;
  estadoFile?: string;
  comentarioCierre?: string;
  fechaRetiro?: string;
  fechaDevolucion?: string;
}

export interface BitacoraComment {
  nroCaso: string;
  nro: number;
  fecha: string;
  etapa: string;
  descripcion: string;
  subEstado: string;
  creadoPor: string;
}

export interface ProcesoConcluido {
  nroCaso: string;
  entidad: string;
  tipo: 'banco' | 'empresa' | 'natural';
  cuentaFile: string;
  abogado: string;
  tipoProceso: string;
  motivoCierre: string;
  motivoBadge: string;
  fechaCierre: string;
  estadoFile: string;
  fileBadge: string;
}

export interface Evento {
  id: number;
  titulo: string;
  tipo: 'audiencia' | 'diligencia' | 'vencimiento' | 'reunion' | 'interno';
  caso: string | null;
  usuario: string;
  fecha: string;
  hi: string;
  hf: string;
  lugar: string;
  desc: string;
}

export interface Notificacion {
  color: string;
  titulo: string;
  proceso: string;
  hora: string;
}

export interface ActualizacionDash {
  nombre: string;
  cambiosBitacora: number;
  cambiosEtapa: number;
  totalActualizaciones: number;
}

export interface BitacoraSemanalDash {
  nombre: string;
  semana1: number;
  semana2: number;
  semana3: number;
  semana4: number;
  semana5: number;
}

export interface DrillCaso {
  fileNum: string;
  nroJuicio: string;
  codigoCliente: string;
  cliente: string;
  abogado: string;
  etapa: string;
  comentario?: string;
  creadoPor?: string;
  estado?: string;
  estadoBadge?: string;
  fechaUltAct?: string;
}

interface FiltroAvConfig {
  id: string;
  label: string;
  opciones: string[];
}

interface InfoAdicionalItem {
  id: number;
  tipo: string;
  descripcion: string;
}

export interface Meta {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  tareaAMedir: string;
  cantidadCasos: number;
  estado: 'activo' | 'inactivo';
  integrantes: MetaIntegrante[];
}

export interface MetaIntegrante {
  id: number;
  usuario: string;
  rol: string;
  equipo: string;
  avancePct: number;
  color: 'verde' | 'amarillo' | 'rojo';
}

export interface HistorialEficiencia {
  id: number;
  meta: string;
  abogado: string;
  rol: string;
  periodo: string;
  casosMeta: number;
  casosLogrados: number;
  avancePct: number;
  color: 'verde' | 'amarillo' | 'rojo';
}


// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-spl',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent, ProductTourComponent, EmptyStateComponent],
  templateUrl: './spl.component.html',
  styleUrl: './spl.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPL implements OnDestroy, OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private chartInstances: any[] = [];

  // ── Usuario ───────────────────────────────────────────────────────────────
  usuarioNombre = computed(() => this.auth.obtenerNombreDisplay());

  // ── KPI getters ───────────────────────────────────────────────────────────
  get totalActivos()   { return this.casosJudiciales.length; }
  get totalVigentes()  { return this.casosJudiciales.filter(c => c.estado === 'Vigente').length; }
  get totalPorVencer() { return this.casosJudiciales.filter(c => c.estado === 'Por Vencer').length; }
  get totalVencidos()  { return this.casosJudiciales.filter(c => c.estado === 'Vencido' || c.estado.startsWith('No')).length; }

  ngAfterViewInit() {
    this.cargarGraficos(this.activeView());
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const caseId = params['case'] || params['caso'] || params['casoId'];
      const tab = params['tab'];
      if (caseId) {
        this.activeTopbarTab.set('procesos');
        this.activeView.set('casos-judiciales');
        setTimeout(() => {
          this.abrirDetalleCaso(caseId);
          if (tab === 'financiera' || tab === 'configuracion' || tab === 'configuracion-financiera') {
            this.activeCasoTab.set('financiera');
          }
        }, 80);
      }
    });
  }

  // ── Métodos de Gráficos ───────────────────────────────────────────────────
  cargarGraficos(vista: string) {
    this.chartInstances.forEach(c => { if (c) c.destroy(); });
    this.chartInstances = [];
    if (vista === 'dashboard-activos')    this.initChartsActivos();
    else if (vista === 'dashboard-concluidos') this.initChartsConcluidos();
    else if (vista === 'dashboard-admin') this.initChartsAdmin();
  }

  private _buildChart(id: string, config: any): void {
    const el = document.getElementById(id) as HTMLCanvasElement;
    if (!el) return;
    this.chartInstances.push(new Chart(el, config));
  }

  initChartsActivos() {
    setTimeout(() => {
      const self = this;

      // 1. Recuento por Etapa Procesal — horizontal bar
      const etapaLabels = ['Actos Preparatorios','Etapa Postulatoria','Etapa Probatoria','Etapa Decisoria','Etapa Impugnatoria','Ejec. Orden Captura','Etapa de Ejecución','Fin del Proceso'];
      const etapaData   = [24, 100, 280, 110, 70, 5, 455, 25];
      const etapaColors = ['#EF4444','#06B6D4','#3B82F6','#F97316','#8B5CF6','#14B8A6','#EC4899','#1F2937'];
      this._buildChart('chart-etapa', {
        type: 'bar',
        data: { labels: etapaLabels, datasets: [{ data: etapaData, backgroundColor: etapaColors, borderRadius: 6, borderSkipped: false }] },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { color: '#F3F4F6' } }, y: { grid: { display: false } } },
          onClick: (_: any, els: any[]) => {
            if (!els.length) return;
            const idx = els[0].index;
            const casos = self.casosJudiciales.filter(c => c.etapa === etapaLabels[idx]).map(c => ({ fileNum: c.nroFile, nroJuicio: c.nroCaso, codigoCliente: '', cliente: c.cliente, abogado: c.abogado, etapa: c.etapa, estado: c.estado, estadoBadge: c.estadoBadge, fechaUltAct: c.plazo }));
            self.openDrilldown('Detalle de Recuento de Etapa Procesal', 'Etapa: ' + etapaLabels[idx].toUpperCase(), 'other', casos);
          }
        }
      });

      // 2. Recuento por Estatus — vertical bar
      const estatusLabels = ['Vigente','Vig. sin Impulso','Por Vencer','Vencido'];
      const estatusData   = [600, 213, 130, 56];
      const estatusColors = ['#22C55E','#9CA3AF','#F59E0B','#EF4444'];
      this._buildChart('chart-estatus', {
        type: 'bar',
        data: { labels: estatusLabels, datasets: [{ data: estatusData, backgroundColor: estatusColors, borderRadius: 6, borderSkipped: false }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: '#F3F4F6' } } },
          onClick: (_: any, els: any[]) => {
            if (!els.length) return;
            const idx = els[0].index;
            const casos = self.casosJudiciales.filter(c => {
              if (estatusLabels[idx] === 'Vig. sin Impulso') return c.estado.startsWith('No') || c.estado === 'Casación';
              return c.estado === estatusLabels[idx];
            }).map(c => ({ fileNum: c.nroFile, nroJuicio: c.nroCaso, codigoCliente: '', cliente: c.cliente, abogado: c.abogado, etapa: c.etapa, estado: c.estado, estadoBadge: c.estadoBadge, fechaUltAct: c.plazo }));
            self.openDrilldown('Detalle de Recuento por Estatus', 'Estado: ' + estatusLabels[idx].toUpperCase(), 'other', casos);
          }
        }
      });

      // 3. Semaforización de Procesos — doughnut mejorado
      const semaforoLabels = ['0% – 50%', '51% – 99%', '100%+'];
      const semaforoData   = [168, 432, 469];
      const semaforoColors = ['#EF4444', '#F59E0B', '#22C55E'];
      this._buildChart('chart-pct-procesal', {
        type: 'doughnut',
        data: {
          labels: semaforoLabels,
          datasets: [{
            data: semaforoData,
            backgroundColor: semaforoColors,
            borderWidth: 3,
            borderColor: '#FFFFFF',
            hoverOffset: 8,
            hoverBorderWidth: 0,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, pointStyle: 'rectRounded', padding: 18, font: { size: 11 }, color: '#6B7280' }
            },
            tooltip: {
              callbacks: {
                label: (c: any) => {
                  const total = semaforoData.reduce((a: number, b: number) => a + b, 0);
                  const pct = ((c.raw / total) * 100).toFixed(1);
                  return ` ${c.raw} procesos (${pct}%)`;
                }
              }
            }
          },
          onClick: (_: any, els: any[]) => {
            if (!els.length) return;
            const idx = els[0].index;
            const rangos = [{ min: 0, max: 50 }, { min: 51, max: 99 }, { min: 100, max: 999 }];
            const r = rangos[idx];
            const casos = self.casosJudiciales.filter(c => c.pct >= r.min && c.pct <= r.max).map(c => ({ fileNum: c.nroFile, nroJuicio: c.nroCaso, codigoCliente: '', cliente: c.cliente, abogado: c.abogado, etapa: c.etapa, estado: c.estado, estadoBadge: c.estadoBadge, fechaUltAct: c.pct + '%' }));
            self.openDrilldown('Semaforización de Procesos', 'Rango: ' + semaforoLabels[idx], 'other', casos);
          }
        }
      });

      this._rebuildChartEntidades();
    }, 50);
  }

  initChartsConcluidos() {
    setTimeout(() => {
      const self = this;

      // 5. Motivo de Cierre — vertical bar
      const motivoLabels = ['Pago Total','Acuerdo Extrajudicial','Sentencia Favorable','Archivo','Prescripción'];
      const motivoData   = [143, 90, 65, 42, 25];
      const motivoColors = ['#F97316','#3B82F6','#22C55E','#9CA3AF','#8B5CF6'];
      this._buildChart('chart-motivo-cierre', {
        type: 'bar',
        data: { labels: motivoLabels, datasets: [{ data: motivoData, backgroundColor: motivoColors, borderRadius: 6, borderSkipped: false }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: '#F3F4F6' } } },
          onClick: (_: any, els: any[]) => {
            if (!els.length) return;
            const idx = els[0].index;
            const casos = self.procesosConcluidos.filter(c => c.motivoCierre === motivoLabels[idx]).map(c => ({ fileNum: c.cuentaFile, nroJuicio: c.nroCaso, codigoCliente: '', cliente: c.entidad, abogado: c.abogado, etapa: c.tipoProceso, estado: c.estadoFile, fechaUltAct: c.fechaCierre }));
            self.openDrilldown('Detalle de Motivo de Cierre', 'Motivo: ' + motivoLabels[idx].toUpperCase(), 'other', casos);
          }
        }
      });

      // 6. Estado de File — doughnut con drilldown
      const estadoFileLabels = ['File Completo','File Incompleto','Pend. Digitalización'];
      const estadoFileData   = [247, 98, 20];
      const estadoFileColors = ['#22C55E','#F59E0B','#EF4444'];
      this._buildChart('chart-estado-file', {
        type: 'doughnut',
        data: { labels: estadoFileLabels, datasets: [{ data: estadoFileData, backgroundColor: estadoFileColors, borderWidth: 3, borderColor: '#FFFFFF', hoverOffset: 8, hoverBorderWidth: 0 }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c: any) => {
                  const total = estadoFileData.reduce((a: number, b: number) => a + b, 0);
                  const pct = ((c.raw / total) * 100).toFixed(1);
                  return ` ${c.raw} files (${pct}%)`;
                }
              }
            }
          },
          onClick: (_: any, els: any[]) => {
            if (!els.length) return;
            const idx = els[0].index;
            const casos = self.procesosConcluidos.filter(c => c.estadoFile.toLowerCase().includes(estadoFileLabels[idx].split(' ')[1]?.toLowerCase() ?? estadoFileLabels[idx].toLowerCase())).map(c => ({ fileNum: c.cuentaFile, nroJuicio: c.nroCaso, codigoCliente: '', cliente: c.entidad, abogado: c.abogado, etapa: c.tipoProceso, estado: c.estadoFile, fechaUltAct: c.fechaCierre }));
            self.openDrilldown('Estado de File', 'Estado: ' + estadoFileLabels[idx].toUpperCase(), 'other', casos);
          }
        }
      });
    }, 50);
  }

  initChartsAdmin() {
    setTimeout(() => {
      // 7. Gastos por Categoría — vertical bar
      this._buildChart('chart-gastos-cat', {
        type: 'bar',
        data: {
          labels: ['Administrativo','Judicial','Peritos','Notarial','Otros'],
          datasets: [{ data: [17000, 32000, 12000, 6000, 10100], backgroundColor: ['#F97316','#3B82F6','#8B5CF6','#06B6D4','#9CA3AF'], borderRadius: 6, borderSkipped: false }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => ` S/ ${(c.raw as number).toLocaleString('es-PE')}` } } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#F3F4F6' }, ticks: { callback: (v: any) => 'S/ ' + (v / 1000) + 'k' } }
          }
        }
      });
    }, 50);
  }

  // ── Helpers de calendario (Mayo 2026, lunes-inicio) ───────────────────────
  readonly calDias: { fecha: string; num: number; otroMes: boolean; esHoy: boolean }[] = (() => {
    const hoy = '2026-05-15';
    const dias: { fecha: string; num: number; otroMes: boolean; esHoy: boolean }[] = [];
    const inicio = new Date(2026, 3, 27); // Apr 27
    for (let i = 0; i < 35; i++) {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      const yyyy = d.getFullYear();
      const mm   = String(d.getMonth() + 1).padStart(2, '0');
      const dd   = String(d.getDate()).padStart(2, '0');
      const fecha = `${yyyy}-${mm}-${dd}`;
      dias.push({ fecha, num: d.getDate(), otroMes: d.getMonth() !== 4, esHoy: fecha === hoy });
    }
    return dias;
  })();

  getEventosParaDia(fecha: string): Evento[] {
    return this.eventosFiltrados.filter(e => e.fecha === fecha);
  }

  get eventosListaDates(): string[] {
    return [...new Set(this.eventosFiltrados.map(e => e.fecha))].sort();
  }

  getEventosParaFecha(fecha: string): Evento[] {
    return this.eventosFiltrados.filter(e => e.fecha === fecha);
  }

  formatFechaLista(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const dias    = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const dt = new Date(y, m - 1, d);
    return `${dias[dt.getDay()]} ${d} de ${nombres[m - 1]} de ${y}`;
  }

  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebarExpanded = signal(true);

  toggleSidebar() {
    this.sidebarExpanded.update(v => !v);
  }

  // ── Topbar Tab ───────────────────────────────────────────────────────────
  readonly topbarTabs: TopbarTab[] = [
    { key: 'inicio',   label: 'Inicio' },
    { key: 'procesos', label: 'Procesos' },
    { key: 'metas',    label: 'Metas' },
  ];

  // ── Notificaciones campanita ──────────────────────────────────────────────
  splNotificaciones = signal<TopbarNotificacion[]>([
    {
      id: 1,
      tipo: 'por-vencer',
      titulo: 'C-2023-0318 — Por vencer pronto',
      descripcion: 'El caso de A. López pasa a "Por Vencer" en 9 días. Etapa Decisoria sin impulso reciente.',
      tiempo: 'Vence 12/06/2026',
      accion: { vista: 'casos-judiciales', casoId: 'C-2023-0318' },
    },
    {
      id: 2,
      tipo: 'por-vencer',
      titulo: 'C-2025-0287 — Próximo vencimiento',
      descripcion: 'Plazo de presentar liquidación vence en 15 días. Etapa de Ejecución — C. Pérez.',
      tiempo: 'Vence 18/06/2026',
      accion: { vista: 'casos-judiciales', casoId: 'C-2025-0287' },
    },
    {
      id: 3,
      tipo: 'vencido',
      titulo: 'C-2024-1102 — Etapa vencida',
      descripcion: 'Etapa Probatoria vencida hace 3 días. Requiere justificación — A. López.',
      tiempo: 'Venció 31/05/2026',
      accion: { vista: 'casos-judiciales', casoId: 'C-2024-1102' },
    },
    {
      id: 4,
      tipo: 'vencido',
      titulo: 'C-2024-0876 — Apelación vencida',
      descripcion: 'Plazo para escrito de apelación expirado sin presentación. M. Rodríguez.',
      tiempo: 'Venció 16/05/2026',
      accion: { vista: 'casos-judiciales', casoId: 'C-2024-0876' },
    },
    {
      id: 5,
      tipo: 'evento',
      titulo: 'Audiencia de sentencia hoy',
      descripcion: 'BBVA Perú — C-2025-0198 · Sala 12 Corte Superior Lima · 11:00 – 12:00 h.',
      tiempo: 'Hoy 03/06/2026',
      accion: { vista: 'eventos' },
    },
  ]);

  handleNotifClick(n: TopbarNotificacion) {
    if (!n.accion) return;
    const { vista, casoId } = n.accion;

    if (vista === 'casos-judiciales') {
      this.activeTopbarTab.set('procesos');
      this.activeView.set('casos-judiciales');
      if (casoId) {
        setTimeout(() => this.abrirDetalleCaso(casoId), 80);
      }
    } else if (vista === 'eventos') {
      this.activeTopbarTab.set('procesos');
      this.activeView.set('eventos');
    }
  }

  readonly tabConfig: Record<string, { subs: string[]; defaultView: string }> = {
    inicio:   { subs: ['sub-activos', 'sub-concluidos-dash', 'sub-admin'],                                    defaultView: 'dashboard-activos'   },
    procesos: { subs: ['sub-casos-judiciales', 'sub-bitacora', 'sub-eventos', 'sub-procesos-concluidos'],     defaultView: 'casos-judiciales'    },
    metas:    { subs: ['sub-metas', 'sub-historial-eficiencia'],                                             defaultView: 'metas'               },
  };

  activeTopbarTab = signal<'inicio' | 'procesos' | 'metas'>('inicio');

  isSubNavVisible(subId: string): boolean {
    const cfg = this.tabConfig[this.activeTopbarTab()];
    return cfg ? cfg.subs.includes(subId) : false;
  }

  cambiarTopbarTab(tab: string) {
    this.activeTopbarTab.set(tab as any);
    const view = this.tabConfig[tab]?.defaultView;
    this.activeView.set(view as any);
    setTimeout(() => this.cargarGraficos(view), 80);
  }

  // ── Main View ────────────────────────────────────────────────────────────
  activeView = signal<
    | 'dashboard-activos'
    | 'dashboard-concluidos'
    | 'dashboard-admin'
    | 'casos-judiciales'
    | 'bitacora'
    | 'eventos'
    | 'procesos-concluidos'
    | 'metas'
    | 'historial-eficiencia'
  >('dashboard-activos');

  activarSubNav(
    tab: 'inicio' | 'procesos' | 'metas',
    view: 'dashboard-activos' | 'dashboard-concluidos' | 'dashboard-admin' | 'casos-judiciales' | 'bitacora' | 'eventos' | 'procesos-concluidos' | 'metas' | 'historial-eficiencia'
  ) {
    this.activeTopbarTab.set(tab);
    this.activeView.set(view);
    setTimeout(() => this.cargarGraficos(view), 80);
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      this.sidebarExpanded.set(false);
    }
  }

  isSubActive(viewId: string): boolean {
    return this.activeView() === viewId;
  }

  // ── Detail sub-panels ────────────────────────────────────────────────────
  showCjDetail = signal(false);
  showBitDetail = signal(false);
  cjDetailTitle = signal('C-2025-0314');
  bitDetailTitle = signal('C-2025-0314');

  abrirDetalleCaso(nroCaso: string) {
    this.cjDetailTitle.set(nroCaso);
    this.activeCasoTab.set('caso-judicial');
    this.showCjDetail.set(true);
  }

  volverListaCasos() {
    this.showCjDetail.set(false);
  }

  bitDetailRow = signal<BitacoraRow | null>(null);
  bitFiltrosAvOpen = signal(false);
  bitIncluirConcluidos = signal(false);

  // ── Procesos Concluidos detalle ───────────────────────────────────────────
  showConcDetail = signal(false);
  concDetailRow  = signal<ProcesoConcluido | null>(null);
  activeConcTab  = signal<'caso-judicial' | 'actores' | 'documentos' | 'financiera'>('caso-judicial');
  modalRevertir  = signal(false);
  revertirRow    = signal<ProcesoConcluido | null>(null);

  get concDetailCaso(): CasoJudicial | undefined {
    return this.casosJudiciales.find(c => c.nroCaso === this.concDetailRow()?.nroCaso);
  }

  abrirDetalleConcluido(row: ProcesoConcluido) {
    this.concDetailRow.set(row);
    this.activeConcTab.set('caso-judicial');
    this.showConcDetail.set(true);
  }

  volverListaConcluidos() {
    this.showConcDetail.set(false);
    this.concDetailRow.set(null);
  }

  openRevertir(row: ProcesoConcluido) {
    this.revertirRow.set(row);
    this.modalRevertir.set(true);
  }

  confirmarRevertir() {
    this.modalRevertir.set(false);
    this.showConcDetail.set(false);
    this.concDetailRow.set(null);
    this.showToastMsg('Caso revertido a Casos Judiciales correctamente');
  }

  get bitacoraFiltradas(): BitacoraRow[] {
    if (this.bitIncluirConcluidos()) return this.bitacoraRows;
    return this.bitacoraRows.filter(r => r.estado !== 'Concluido');
  }

  getComentariosBitacora(nroCaso: string): BitacoraComment[] {
    return this.bitacoraComentarios().filter(c => c.nroCaso === nroCaso);
  }

  // ── Editar / Eliminar comentarios de Bitácora ────────────────────────────
  modalEditarComentarioBit       = signal(false);
  modalConfirmarEliminarBit      = signal(false);
  bitComentarioEditando          = signal<BitacoraComment | null>(null);
  bitComentarioEditTexto         = signal('');
  bitComentarioEditFecha         = signal('');
  bitComentarioEliminar          = signal<BitacoraComment | null>(null);

  abrirEditarComentarioBit(c: BitacoraComment) {
    this.bitComentarioEditando.set(c);
    this.bitComentarioEditTexto.set(c.descripcion);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.bitComentarioEditFecha.set(`${yyyy}-${mm}-${dd}`);
    this.modalEditarComentarioBit.set(true);
  }

  guardarEditarComentarioBit() {
    const c = this.bitComentarioEditando();
    if (!c) return;
    this.bitacoraComentarios.update(arr =>
      arr.map(item =>
        item.nroCaso === c.nroCaso && item.nro === c.nro
          ? { ...item, descripcion: this.bitComentarioEditTexto(), fecha: this.bitComentarioEditFecha() }
          : item
      )
    );
    this.modalEditarComentarioBit.set(false);
    this.showToastMsg('Comentario actualizado correctamente');
  }

  abrirConfirmarEliminarBit(c: BitacoraComment) {
    this.bitComentarioEliminar.set(c);
    this.modalConfirmarEliminarBit.set(true);
  }

  confirmarEliminarBit() {
    const c = this.bitComentarioEliminar();
    if (!c) return;
    this.bitacoraComentarios.update(arr =>
      arr.filter(item => !(item.nroCaso === c.nroCaso && item.nro === c.nro))
    );
    this.modalConfirmarEliminarBit.set(false);
    this.showToastMsg('Comentario eliminado');
  }

  abrirDetalleBitacora(row: BitacoraRow) {
    this.bitDetailRow.set(row);
    this.bitDetailTitle.set(row.nroCaso);
    this.showBitDetail.set(true);
  }

  volverListaBitacora() {
    this.showBitDetail.set(false);
    this.bitDetailRow.set(null);
  }

  // ── Caso detail tabs ─────────────────────────────────────────────────────
  activeCasoTab = signal<'caso-judicial' | 'actores' | 'documentos' | 'financiera'>('caso-judicial');

  cambiarTabCaso(tab: 'caso-judicial' | 'actores' | 'documentos' | 'financiera') {
    this.activeCasoTab.set(tab);
  }

  // ── Dropdowns ────────────────────────────────────────────────────────────
  userDropdownOpen = signal(false);
  notifDropdownOpen = signal(false);
  estEspecialesOpen = signal(false);

  toggleDropdown() {
    this.userDropdownOpen.update(v => !v);
    this.notifDropdownOpen.set(false);
  }

  toggleNotif() {
    this.notifDropdownOpen.update(v => !v);
    this.userDropdownOpen.set(false);
  }

  toggleEstadosEspeciales() {
    this.estEspecialesOpen.update(v => !v);
  }

  closeAllDropdowns() {
    this.userDropdownOpen.set(false);
    this.notifDropdownOpen.set(false);
    this.estEspecialesOpen.set(false);
    this.infoAdicionalDropOpen.set(null);
  }

  // ── Estados Especiales ───────────────────────────────────────────────────
  eeNoImpulso = signal(false);
  eeCasacion = signal(false);
  eeNoImpulsable = signal(false);

  getEstadosLabel(): string {
    const activos = [];
    if (this.eeNoImpulso()) activos.push('No Impulso – Banco');
    if (this.eeCasacion()) activos.push('Casación');
    if (this.eeNoImpulsable()) activos.push('No Impulsable');
    return activos.length ? activos.join(' · ') : 'Sin estado especial activo';
  }

  // ── Modals ───────────────────────────────────────────────────────────────
  modalDownloadActivos = signal(false);
  modalDownloadConcluidos = signal(false);
  modalNuevoCaso = signal(false);
  modalCargarDoc = signal(false);
  modalNuevoEvento = signal(false);
  modalSiguienteEtapa = signal(false);
  modalVerEtapa = signal(false);
  modalAgregarComentario = signal(false);
  modalAgregarJustificacion = signal(false);
  modalVerDoc = signal(false);
  modalEnvioCorreo = signal(false);
  modalMotivoCierre = signal(false);
  modalDerivacion = signal(false);
  modalConfirmarEliminar = signal(false);
  modalRetirarCuenta = signal(false);
  modalFechasEtapa = signal(false);
  modalAgregarCuentaExistente = signal(false);
  demandadoParaCuenta = signal('');
  modalCargaMasiva = signal(false);
  cargaMasivaTab = signal<'proceso' | 'etapa'>('proceso');

  openModal(id: string) {
    const map: Record<string, () => void> = {
      'modal-download-activos':     () => this.modalDownloadActivos.set(true),
      'modal-download-concluidos': () => this.modalDownloadConcluidos.set(true),
      'modal-nuevo-caso':          () => this.modalNuevoCaso.set(true),
      'modal-cargar-doc':          () => this.modalCargarDoc.set(true),
      'modal-nuevo-evento':        () => this.modalNuevoEvento.set(true),
      'modal-siguiente-etapa':     () => this.modalSiguienteEtapa.set(true),
      'modal-ver-etapa':           () => this.modalVerEtapa.set(true),
      'modal-agregar-comentario':  () => this.modalAgregarComentario.set(true),
      'modal-agregar-justificacion': () => this.modalAgregarJustificacion.set(true),
      'modal-ver-doc':             () => this.modalVerDoc.set(true),
      'modal-envio-correo':        () => this.modalEnvioCorreo.set(true),
      'modal-motivo-cierre':       () => this.modalMotivoCierre.set(true),
      'modal-derivacion':          () => this.modalDerivacion.set(true),
      'modal-confirmar-eliminar':  () => this.modalConfirmarEliminar.set(true),
      'modal-retirar-cuenta':      () => this.modalRetirarCuenta.set(true),
      'modal-fechas-etapa':        () => this.modalFechasEtapa.set(true),
      'modal-liquidar':            () => this.modalLiquidar.set(true),
      'modal-liquidacion-creada':  () => this.modalLiquidacionCreada.set(true),
      'modal-agregar-cuenta-existente':    () => this.modalAgregarCuentaExistente.set(true),
      'modal-editar-comentario-bit':       () => this.modalEditarComentarioBit.set(true),
      'modal-confirmar-eliminar-bit':      () => this.modalConfirmarEliminarBit.set(true),
      'modal-carga-masiva':               () => this.modalCargaMasiva.set(true),
    };
    map[id]?.();
  }

  closeModal(id: string) {
    const map: Record<string, () => void> = {
      'modal-download-activos':     () => this.modalDownloadActivos.set(false),
      'modal-download-concluidos': () => this.modalDownloadConcluidos.set(false),
      'modal-nuevo-caso':          () => this.modalNuevoCaso.set(false),
      'modal-cargar-doc':          () => this.modalCargarDoc.set(false),
      'modal-nuevo-evento':        () => this.modalNuevoEvento.set(false),
      'modal-siguiente-etapa':     () => this.modalSiguienteEtapa.set(false),
      'modal-ver-etapa':           () => this.modalVerEtapa.set(false),
      'modal-agregar-comentario':  () => this.modalAgregarComentario.set(false),
      'modal-agregar-justificacion': () => this.modalAgregarJustificacion.set(false),
      'modal-ver-doc':             () => this.modalVerDoc.set(false),
      'modal-envio-correo':        () => this.modalEnvioCorreo.set(false),
      'modal-motivo-cierre':       () => this.modalMotivoCierre.set(false),
      'modal-derivacion':          () => this.modalDerivacion.set(false),
      'modal-confirmar-eliminar':  () => this.modalConfirmarEliminar.set(false),
      'modal-retirar-cuenta':      () => this.modalRetirarCuenta.set(false),
      'modal-fechas-etapa':        () => this.modalFechasEtapa.set(false),
      'modal-liquidar':            () => this.modalLiquidar.set(false),
      'modal-liquidacion-creada':  () => this.modalLiquidacionCreada.set(false),
      'modal-agregar-cuenta-existente':    () => this.modalAgregarCuentaExistente.set(false),
      'modal-editar-comentario-bit':       () => this.modalEditarComentarioBit.set(false),
      'modal-confirmar-eliminar-bit':      () => this.modalConfirmarEliminarBit.set(false),
      'modal-carga-masiva':               () => this.modalCargaMasiva.set(false),
    };
    map[id]?.();
  }

  confirmarCargaMasiva() {
    this.modalCargaMasiva.set(false);
    this.showToastMsg('Carga masiva procesada correctamente');
  }

  // ── Modal context state ───────────────────────────────────────────────────
  etapaModalTitle = signal('Etapa Decisoria');
  etapaModalEstado = signal('En Curso');
  etapaModalInicio = signal('17/05/2025');
  etapaModalFin = signal('16/06/2025');

  comentarioEtapaNombre = signal('Etapa Decisoria');

  mcCasoTitle = signal('C-2025-0314');
  derCasoTitle = signal('C-2025-0314');
  elimCasoTitle = signal('C-2025-0314');

  verDocNombre = signal('Demanda inicial');

  // ── Toast ────────────────────────────────────────────────────────────────
  toastVisible = signal(false);
  toastMsg = signal('Operación completada');
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  showToastMsg(msg: string) {
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    this._toastTimer = setTimeout(() => this.toastVisible.set(false), 3000);
  }

  // ── Auth actions ─────────────────────────────────────────────────────────
  handlereturn() {
    this.router.navigate(['/portal']);
  }

  handleLogout() {
    this.auth.logout();
  }

  // ── Stars ────────────────────────────────────────────────────────────────
  toggleStar(caso: CasoJudicial) {
    caso.starred = !caso.starred;
  }

  // ── Filtro Dashboard Entidad ─────────────────────────────────────────────
  dashFiltroEntidad = signal<'todos' | 'banco' | 'empresa' | 'natural'>('todos');
  onChangeDashEntidad(val: string) {
    this.dashFiltroEntidad.set(val as any);
  }

  // ── Filtro Procesos Concluidos ────────────────────────────────────────────
  concTipo = signal<'todos' | 'banco' | 'empresa' | 'natural'>('todos');
  filtrarConcluidos(tipo: 'todos' | 'banco' | 'empresa' | 'natural') {
    this.concTipo.set(tipo);
  }
  get procesosConcFiltrados(): ProcesoConcluido[] {
    const t = this.concTipo();
    if (t === 'todos') return this.procesosConcluidos;
    return this.procesosConcluidos.filter(p => p.tipo === t);
  }

  // ── Nuevo Caso tipo entidad ───────────────────────────────────────────────
  ncTipoEntidad = signal('');
  onChangeTipoEntidadNuevo() { /* reactive via signal */ }

  // ── Modal Siguiente Etapa ─────────────────────────────────────────────────
  confirmarSiguienteEtapa() {
    this.modalSiguienteEtapa.set(false);
    this.showToastMsg('Caso avanzado a la siguiente etapa correctamente');
  }

  // ── Modal Ver Etapa ───────────────────────────────────────────────────────
  abrirComentarioDesdeInfo() {
    this.modalVerEtapa.set(false);
    setTimeout(() => this.modalAgregarComentario.set(true), 150);
  }

  // ── Modal Motivo Cierre ───────────────────────────────────────────────────
  mcEntidad  = signal<'Banco' | 'Empresa' | 'Natural'>('Banco');
  mcCliente  = signal('BCP S.A.');
  mcTipo     = signal('Cobranza');
  mcMotivoUnico = signal('');

  mcCuentas = signal<{ num: string; file: string; moneda: string; monto: string; checked: boolean; motivo: string }[]>([
    { num: 'Cta. 001', file: 'FILE-2025-0087', moneda: 'S/', monto: '45,000.00', checked: false, motivo: '' },
    { num: 'Cta. 002', file: 'FILE-2025-0088', moneda: 'S/', monto: '12,500.00', checked: false, motivo: '' },
  ]);

  mcCuentasCount = computed(() => this.mcCuentas().filter(c => c.checked).length);

  toggleCuentaCierre(index: number) {
    this.mcCuentas.update(arr =>
      arr.map((c, i) => i === index ? { ...c, checked: !c.checked } : c)
    );
  }

  setCuentaMotivo(index: number, motivo: string) {
    this.mcCuentas.update(arr =>
      arr.map((c, i) => i === index ? { ...c, motivo } : c)
    );
  }

  openMotivoCierre(caso: CasoJudicial | string) {
    const id  = typeof caso === 'string' ? caso : caso.nroCaso;
    const ent = typeof caso === 'string' ? 'Banco'    : caso.entidad;
    const cli = typeof caso === 'string' ? ''         : caso.cliente;
    const tip = typeof caso === 'string' ? 'Cobranza' : caso.tipo;
    this.mcCasoTitle.set(id);
    this.mcEntidad.set(ent);
    this.mcCliente.set(cli);
    this.mcTipo.set(tip);
    this.modalMotivoCierre.set(true);
  }

  confirmarCierre() {
    this.modalMotivoCierre.set(false);
    this.showToastMsg('Caso cerrado y trasladado a Procesos Concluidos');
  }

  // ── Modal Liquidar ────────────────────────────────────────────────────────
  modalLiquidar          = signal(false);
  modalLiquidacionCreada = signal(false);

  confirmarLiquidacion() {
    this.estadoFinanciero.set('Liquidado');
    this.modalLiquidar.set(false);
    this.modalLiquidacionCreada.set(true);
  }

  irAGAP() {
    this.router.navigate(['/gap']);
  }

  // ── Modal Derivar ─────────────────────────────────────────────────────────
  derAbogadoActual = signal('');

  openDerivacion(nroCaso: string, abogado?: string) {
    this.derCasoTitle.set('Proceso ' + nroCaso);
    this.derAbogadoActual.set(abogado ?? '');
    this.modalDerivacion.set(true);
  }

  // ── Modal Eliminar ────────────────────────────────────────────────────────
  openEliminar(nroCaso: string) {
    this.elimCasoTitle.set(nroCaso);
    this.modalConfirmarEliminar.set(true);
  }

  ejecutarEliminar() {
    const nro = this.elimCasoTitle();
    this.casosJudiciales = this.casosJudiciales.filter(c => c.nroCaso !== nro);
    this.modalConfirmarEliminar.set(false);
    this.showToastMsg('Proceso ' + nro + ' eliminado correctamente');
  }

  // ── Modal Etapa Info ──────────────────────────────────────────────────────
  verInfoEtapa(nombre: string, estado: string, inicio: string, fin: string) {
    this.etapaModalTitle.set(nombre);
    this.etapaModalEstado.set(estado);
    this.etapaModalInicio.set(inicio);
    this.etapaModalFin.set(fin);
    this.modalVerEtapa.set(true);
  }

  agregarComentarioEtapa(nombre: string) {
    this.comentarioEtapaNombre.set(nombre);
    this.modalAgregarComentario.set(true);
  }

  guardarComentarioEtapa() {
    this.modalAgregarComentario.set(false);
    this.showToastMsg('Comentario guardado correctamente');
  }

  // ── Modal Ver Documento ───────────────────────────────────────────────────
  verDocumento(nombre: string) {
    this.verDocNombre.set(nombre);
    this.modalVerDoc.set(true);
  }

  enviarDocumento(_nombre: string) {
    this.modalEnvioCorreo.set(true);
  }

  guardarDocumento() {
    this.modalCargarDoc.set(false);
    this.showToastMsg('Documento guardado correctamente');
  }

  enviarDocDesdeVisor() {
    this.modalVerDoc.set(false);
    setTimeout(() => this.modalEnvioCorreo.set(true), 150);
  }

  // ── Modal Envío Correo ────────────────────────────────────────────────────
  paraDesplegado   = signal(false);
  contactosCorreo  = signal<{ nombre: string; email: string; checked: boolean }[]>([
    { nombre: 'Juan Pérez',    email: 'jperez@bcp.com.pe',    checked: true  },
    { nombre: 'Ana García',    email: 'agarcia@bcp.com.pe',   checked: false },
    { nombre: 'Luis Torres',   email: 'ltorres@estudio.pe',   checked: false },
  ]);

  toggleContacto(index: number) {
    this.contactosCorreo.update(arr =>
      arr.map((c, i) => i === index ? { ...c, checked: !c.checked } : c)
    );
  }

  enviarCorreoDoc() {
    this.modalEnvioCorreo.set(false);
    this.showToastMsg('Correo enviado correctamente');
  }

  guardarJustificacion() {
    this.modalAgregarJustificacion.set(false);
    this.showToastMsg('Justificación guardada correctamente');
  }

  // ── Nuevo Evento ──────────────────────────────────────────────────────────
  neEvTipo  = signal<'audiencia' | 'diligencia' | 'vencimiento' | 'reunion' | 'interno' | ''>('');
  neNroCaso = signal<string>('');

  abrirNuevoEvento(nroCaso?: string) {
    this.neEvTipo.set('');
    this.neNroCaso.set(nroCaso ?? '');
    this.modalNuevoEvento.set(true);
  }

  guardarNuevoEvento() {
    this.modalNuevoEvento.set(false);
    this.neEvTipo.set('');
    this.neNroCaso.set('');
    this.showToastMsg('Evento guardado correctamente');
  }

  // ── Retirar Cuenta ────────────────────────────────────────────────────────
  rcTipo = signal('');
  openRetirarCuenta() {
    this.modalRetirarCuenta.set(true);
  }
  confirmarRetiroCuenta() {
    this.modalRetirarCuenta.set(false);
    if (this.rcTipo() === 'concluido') {
      this.modalMotivoCierre.set(true);
    } else {
      this.showToastMsg('Cuenta retirada del proceso correctamente');
    }
  }

  // ── Modificar Fechas Etapas ───────────────────────────────────────────────
  guardarFechasEtapa() {
    this.modalFechasEtapa.set(false);
    this.showToastMsg('Fechas de etapa updated correctamente');
  }

  // ── Eventos vista ─────────────────────────────────────────────────────────
  evVista = signal<'mes' | 'semana' | 'dia' | 'lista'>('mes');
  evDetallePanelOpen = signal(false);
  evDetalleActual = signal<Evento | null>(null);
  evTiposActivos = signal(new Set(['audiencia', 'diligencia', 'vencimiento', 'reunion', 'interno']));

  setEvVista(v: 'mes' | 'semana' | 'dia' | 'lista') {
    this.evVista.set(v);
  }

  toggleEvTipo(tipo: string) {
    const s = new Set(this.evTiposActivos());
    if (s.has(tipo)) s.delete(tipo); else s.add(tipo);
    this.evTiposActivos.set(s);
  }

  isEvTipoActive(tipo: string): boolean {
    return this.evTiposActivos().has(tipo);
  }

  verEventoDetalle(ev: Evento) {
    this.evDetalleActual.set(ev);
    this.evDetallePanelOpen.set(true);
  }

  cerrarEvDetalle() {
    this.evDetallePanelOpen.set(false);
  }

  get eventosFiltrados(): Evento[] {
    return this.evData.filter(e => this.evTiposActivos().has(e.tipo));
  }

  getEvColorBg(tipo: string): string {
    const m: Record<string, string> = {
      audiencia: '#DBEAFE', diligencia: '#FFEDD5',
      vencimiento: '#FEE2E2', reunion: '#CCFBF1', interno: '#EDE9FE',
    };
    return m[tipo] ?? '#F3F4F6';
  }
  getEvColorText(tipo: string): string {
    const m: Record<string, string> = {
      audiencia: '#1D4ED8', diligencia: '#C2410C',
      vencimiento: '#B91C1C', reunion: '#0F766E', interno: '#6D28D9',
    };
    return m[tipo] ?? '#374151';
  }
  getEvColorDot(tipo: string): string {
    const m: Record<string, string> = {
      audiencia: '#3B82F6', diligencia: '#F97316',
      vencimiento: '#EF4444', reunion: '#14B8A6', interno: '#8B5CF6',
    };
    return m[tipo] ?? '#9CA3AF';
  }

  // ── Navegación calendario eventos ────────────────────────────────────────
  evNav(_dir: number) {}
  evNavHoy() {}
  evFiltroUsuario = signal('todos');

  // Semana de referencia: lunes 11 – domingo 17 de mayo 2026
  readonly evSemana: string[] = (() => {
    const dates: string[] = [];
    const start = new Date(2026, 4, 11);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime());
      d.setDate(start.getDate() + i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    }
    return dates;
  })();

  getDiaNombreCorto(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'][new Date(y, m-1, d).getDay()];
  }

  getDiaNum(iso: string): number {
    return parseInt(iso.split('-')[2], 10);
  }

  formatFechaDetalle(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return `${dias[new Date(y, m-1, d).getDay()]}, ${d} de ${meses[m-1]} de ${y}`;
  }

  // ── Nuevo Caso: Inline form ──────────────────────────────────────────────
  showNuevoCaso   = signal(false);
  nuevoCasoTab    = signal<'actividad' | 'datos'>('actividad');
  ncTipoCaso      = signal('');
  ncEntidad       = signal('');
  ncFechaAsig     = signal('');

  // Correlativo auto-generado (solo lectura)
  get ncNroCasoAuto(): string {
    const year = new Date().getFullYear();
    const next  = String(this.casosJudiciales.length + 1).padStart(4, '0');
    return `C-${year}-${next}`;
  }

  // Tipos de caso que manejan monto de demanda (visible/editable solo en edición)
  readonly ncTiposConMonto = ['Cobranza', 'Civil', 'Laboral', 'Penal'];

  // Paso 1 válido: los 3 campos requeridos deben estar llenos
  ncPaso1Completo = computed(() =>
    this.ncEntidad() !== '' &&
    this.ncTipoCaso() !== '' &&
    this.ncFechaAsig() !== ''
  );

  // Clientes filtrados según entidad seleccionada
  get ncClientesFiltrados(): string[] {
    switch (this.ncEntidad()) {
      case 'Banco':   return ['BCP S.A.', 'Interbank S.A.', 'BBVA Perú', 'Scotiabank Perú', 'MiBanco S.A.'];
      case 'Empresa': return ['Inmobiliaria XYZ S.A.C.', 'Constructora ABC S.A.C.', 'Tech Corp S.A.', 'Distribuidora Norte S.A.'];
      case 'Natural': return ['Juan Pérez García', 'María López Torres', 'Carlos Rodríguez Silva', 'Ana Flores Mendoza'];
      default:        return [];
    }
  }

  abrirNuevoCaso() {
    this.showNuevoCaso.set(true);
    this.nuevoCasoTab.set('actividad');
    this.ncTipoCaso.set('');
    this.ncEntidad.set('');
    this.ncFechaAsig.set('');
  }

  nuevoCasoSiguiente() {
    if (this.ncPaso1Completo()) {
      this.nuevoCasoTab.set('datos');
    }
  }

  nuevoCasoCancelar() {
    this.showNuevoCaso.set(false);
  }

  nuevoCasoGuardar() {
    this.showNuevoCaso.set(false);
    this.showToastMsg('Caso judicial creado correctamente');
  }

  // ── Filtro Año (Procesos Concluidos) ─────────────────────────
  onFiltroAnoChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    // placeholder — filtrar procesosConcluidos por año si se implementa backend
    console.log('Filtro año:', val);
  }

  // ── Modal Drilldown de gráficos ───────────────────────────────
  drilldownOpen  = signal(false);
  drilldownTitle = signal('');
  drilldownSub   = signal('');
  drillMode      = signal<'act' | 'other'>('act');

  drillPage     = signal(0);
  drillPageSize = signal(10);
  private drillAllCasos = signal<DrillCaso[]>([]);

  drillPagedCasos = computed(() => {
    const start = this.drillPage() * this.drillPageSize();
    return this.drillAllCasos().slice(start, start + this.drillPageSize());
  });

  drillTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.drillAllCasos().length / this.drillPageSize()))
  );

  drillRangeLabel = computed(() => {
    const total = this.drillAllCasos().length;
    if (total === 0) return '0 registros';
    const start = this.drillPage() * this.drillPageSize() + 1;
    const end   = Math.min(start + this.drillPageSize() - 1, total);
    return `${start}–${end} de ${total}`;
  });

  drillPrevPage() { this.drillPage.update(p => Math.max(0, p - 1)); }
  drillNextPage() { this.drillPage.update(p => Math.min(this.drillTotalPages() - 1, p + 1)); }
  drillSetPageSize(size: number) { this.drillPageSize.set(size); this.drillPage.set(0); }

  openDrilldown(title: string, sub: string, mode: 'act' | 'other', casos: DrillCaso[]) {
    this.drilldownTitle.set(title);
    this.drilldownSub.set(sub);
    this.drillMode.set(mode);
    this.drillAllCasos.set(casos);
    this.drillPage.set(0);
    this.drilldownOpen.set(true);
  }

  closeDrilldown() { this.drilldownOpen.set(false); }

  // ── Config. Financiera ───────────────────────────────────────
  estadoFinanciero = signal<'En Cobranza' | 'Liquidable' | 'Liquidado' | 'Cerrado'>('Liquidable');

  readonly etapasCasoDatos = [
    { nro: '01', nombre: 'Actos Preparatorios', inicio: '15/01/2025', fin: '14/02/2025', plazoLabel: 'Completada', estadoKey: 'completada' as const },
    { nro: '02', nombre: 'Etapa Postulatoria',  inicio: '15/02/2025', fin: '16/03/2025', plazoLabel: 'Completada', estadoKey: 'completada' as const },
    { nro: '03', nombre: 'Etapa Probatoria',    inicio: '17/03/2025', fin: '16/05/2025', plazoLabel: 'Completada', estadoKey: 'completada' as const },
    { nro: '04', nombre: 'Etapa Decisoria',     inicio: '17/05/2025', fin: '16/06/2025', plazoLabel: '18 días',   estadoKey: 'en-curso'   as const },
  ];

  etapasSortOrder   = signal<'reciente' | 'antigua'>('reciente');
  etapasCasoPage    = signal(1);
  etapasCasoPageSize = signal(5);

  etapasCasoSorted = computed(() => {
    const arr = [...this.etapasCasoDatos];
    return this.etapasSortOrder() === 'reciente' ? arr.reverse() : arr;
  });

  etapasCasoTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.etapasCasoSorted().length / this.etapasCasoPageSize()))
  );

  etapasCasoPageData = computed(() => {
    const start = (this.etapasCasoPage() - 1) * this.etapasCasoPageSize();
    return this.etapasCasoSorted().slice(start, start + this.etapasCasoPageSize());
  });

  etapasSetPageSize(val: string) { this.etapasCasoPageSize.set(+val); this.etapasCasoPage.set(1); }
  etapasPageNav(dir: number) { this.etapasCasoPage.update(p => Math.min(Math.max(1, p + dir), this.etapasCasoTotalPages())); }

  cuentasExtraArr = signal<number[]>([]);
  agregarCuentaDemandado()  { this.cuentasExtraArr.update(arr => [...arr, arr.length]); }
  quitarCuentaDemandado()   { this.cuentasExtraArr.update(arr => arr.slice(0, -1)); }

  // ── Auth computed ────────────────────────────────────────────
  coberturaActiva = computed(() => this.auth.coberturaActiva());
  esIndependiente      = computed(() => this.auth.esIndependiente());
  esAdminODigitador    = computed(() => this.auth.esAdmin() || this.auth.esDigitador());

  // ── Información Adicional ─────────────────────────────────────
  readonly tiposInfoAdicional = [
    'No Impulso', 'Posterior a PA', 'Estado Alerta Registral', 'N de Alerta',
    'Garantía - Embargo', 'Inmueble', 'Vehículo', 'Cuenta Corriente',
    'Departamento', 'Local Comercial',
  ];
  infoAdicionalItems = signal<InfoAdicionalItem[]>([
    { id: 1, tipo: 'Inmueble', descripcion: 'MANZANA I, LOTE 24, URB. VILLA CLUB, SEGUNDA ETAPA, DISTRITO DE CARABAYLLO, PROVINCIA Y DEPARTAMENTO DE LIMA, INSCRITO EN LA PARTIDA ELECTRÓNICA NRO. 13025685 DEL REGISTRO DE PROPIEDAD INMUEBLE DE LIMA' },
  ]);
  infoAdicionalDropOpen = signal<number | null>(null);

  // ── Dashboard filters ─────────────────────────────────────────
  dashFiltroTipo        = signal('todos');
  dashFiltroAnio        = signal('todos');
  dashFiltroMes         = signal('todos');
  dashFiltroAbogado     = signal('todos');
  dashFiltroFuncionario = signal('todos');
  dashFiltroEstado      = signal('todos');

  onDashFiltroAnioChange(val: string) {
    this.dashFiltroAnio.set(val);
    setTimeout(() => this._rebuildChartEntidades(), 0);
  }

  private _rebuildChartEntidades(): void {
    this.chartInstances = this.chartInstances.filter(c => {
      if (c.canvas?.id === 'chart-entidades') { c.destroy(); return false; }
      return true;
    });

    const anio = this.dashFiltroAnio();
    const sinFiltro = anio === 'todos';
    const anos  = ['2021','2022','2023','2024','2025'];
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const labels = sinFiltro ? anos : meses;

    const entidadSeries = ['Banco','Empresa','Natural'];
    const entidadData = sinFiltro
      ? [[820,870,910,958,995],[80,85,90,98,102],[38,40,42,46,48]]
      : [[820,835,855,872,885,900,918,928,942,958,975,995],[80,82,84,86,88,90,92,94,96,98,100,102],[38,39,40,41,42,43,44,44,45,46,47,48]];

    const self = this;
    this._buildChart('chart-entidades', {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Banco',   data: entidadData[0], borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,.1)',  fill: true, tension: .4, pointRadius: 4, pointHoverRadius: 7 },
          { label: 'Empresa', data: entidadData[1], borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,.07)', fill: true, tension: .4, pointRadius: 4, pointHoverRadius: 7 },
          { label: 'Natural', data: entidadData[2], borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,.07)', fill: true, tension: .4, pointRadius: 4, pointHoverRadius: 7 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#F3F4F6' } } },
        onClick: (_: any, els: any[]) => {
          if (!els.length) return;
          const serieIdx = els[0].datasetIndex;
          const idx = els[0].index;
          const entidad = entidadSeries[serieIdx];
          const cantidad = entidadData[serieIdx][idx];
          const label = labels[idx];
          const casos = self.casosJudiciales.filter(c => {
            if (entidad === 'Banco')   return c.cliente.toLowerCase().includes('bcp') || c.cliente.toLowerCase().includes('bank') || c.cliente.toLowerCase().includes('scotia') || c.cliente.toLowerCase().includes('interbank') || c.cliente.toLowerCase().includes('bbva');
            if (entidad === 'Empresa') return c.cliente.toLowerCase().includes('s.a') || c.cliente.toLowerCase().includes('sac') || c.cliente.toLowerCase().includes('inmob');
            return true;
          }).map(c => ({ fileNum: c.nroFile, nroJuicio: c.nroCaso, codigoCliente: '', cliente: c.cliente, abogado: c.abogado, etapa: c.etapa, estado: c.estado, estadoBadge: c.estadoBadge, fechaUltAct: c.plazo }));
          self.openDrilldown('Procesos por Tipo de Entidad', entidad.toUpperCase() + ' · ' + label + ' — ' + cantidad + ' procesos', 'other', casos);
        }
      }
    });
  }

  // ── Pagination: Actualizaciones table ─────────────────────────
  actPage     = signal(0);
  actPageSize = signal(5);
  actPaged = computed(() => {
    const start = this.actPage() * this.actPageSize();
    return this.actDashData.slice(start, start + this.actPageSize());
  });
  actTotalPages = computed(() => Math.max(1, Math.ceil(this.actDashData.length / this.actPageSize())));

  // ── Pagination: Bitácora semanal table ────────────────────────
  bsPage     = signal(0);
  bsPageSize = signal(5);
  bsPaged = computed(() => {
    const start = this.bsPage() * this.bsPageSize();
    return this.bsDashData.slice(start, start + this.bsPageSize());
  });
  bsTotalPages = computed(() => Math.max(1, Math.ceil(this.bsDashData.length / this.bsPageSize())));

  openActPreview() {
    const casos: DrillCaso[] = [
      { fileNum: '',     nroJuicio: '',      codigoCliente: 'IDC146554289', cliente: 'AMPUERO CORDOVA DIEGO JOSE',    abogado: 'Gino Castillo', etapa: 'ETAPA POSTULATORIA', comentario: 'Comentario de Prueba, xasasas a s asasa, JOEL CASTILLO', creadoPor: 'sigcomt Administrador' },
      { fileNum: '2342', nroJuicio: '56724', codigoCliente: 'IDC107289037', cliente: 'LOAYZA GARCIA CESAR ALEXSI',   abogado: 'Gino Castillo', etapa: 'ETAPA DE EJECUCIÓN',  comentario: '',                                                    creadoPor: 'sigcomt Administrador' },
      { fileNum: '10019',nroJuicio: '78696', codigoCliente: 'IDC107764564', cliente: 'HIGUCHI MIYASATO DAVID MANUEL',abogado: 'Gino Castillo', etapa: 'ETAPA DECISORIA',     comentario: '',                                                    creadoPor: 'Castillo Gino' },
      { fileNum: '9500', nroJuicio: '74715', codigoCliente: 'IDC109566005', cliente: 'LARA AGUILAR ROSA',            abogado: 'Gino Castillo', etapa: 'ETAPA IMPUGNATORIA',  comentario: 'Comentario para validar desde bitacora',             creadoPor: 'sigcomt Administrador' },
      { fileNum: '10220',nroJuicio: '80352', codigoCliente: 'IDC142405018', cliente: 'ALLPAS CERRON ROBERTO CARLOS', abogado: 'Gino Castillo', etapa: 'ETAPA PROBATORIA',    comentario: '',                                                    creadoPor: 'Castillo Gino' },
    ];
    this.openDrilldown('Recuento de actualización de procesos', '', 'act', casos);
  }

  // ── Pagination: Casos Judiciales ─────────────────────────────
  cjPage     = signal(1);
  cjPageSize = signal(5);

  cjTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.casosJudiciales.length / this.cjPageSize()))
  );

  cjPaginated = computed(() => {
    const start = (this.cjPage() - 1) * this.cjPageSize();
    return this.casosJudiciales.slice(start, start + this.cjPageSize());
  });

  cjSetPageSize(val: string) {
    this.cjPageSize.set(+val);
    this.cjPage.set(1);
  }

  cjPageNav(dir: number) {
    this.cjPage.update(p => Math.min(Math.max(1, p + dir), this.cjTotalPages()));
  }

  // ── Pagination: Bitácora ──────────────────────────────────────
  bitPage     = signal(1);
  bitPageSize = signal(5);

  bitTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.bitacoraFiltradas.length / this.bitPageSize()))
  );

  bitPaginated = computed(() => {
    const start = (this.bitPage() - 1) * this.bitPageSize();
    return this.bitacoraFiltradas.slice(start, start + this.bitPageSize());
  });

  bitSetPageSize(val: string) {
    this.bitPageSize.set(+val);
    this.bitPage.set(1);
  }

  bitPageNav(dir: number) {
    this.bitPage.update(p => Math.min(Math.max(1, p + dir), this.bitTotalPages()));
  }

  // ── Filtros Avanzados ─────────────────────────────────────────
  filtrosAvOpen  = signal(false);
  filtroAvOpenId = signal<string | null>(null);
  filtroAvSel: Record<string, string[]> = {};
  filtroAvSearch: Record<string, string> = {};

  readonly filtroAvConfig: FiltroAvConfig[] = [
    { id: 'nroFile',       label: 'Nro. de File',         opciones: ['FILE-2025-0001','FILE-2025-0002','FILE-2025-0087','FILE-2025-0061','FILE-2024-0298','FILE-2024-0201','FILE-2025-0112','FILE-2024-0178','FILE-2023-0134','FILE-2023-0089','F-2025-001','F-2025-002','F-2025-003','F-2024-088','F-2024-041','F-2025-018','F-2025-009','F-2023-067','F-2023-089','F-2023-112'] },
    { id: 'nroJuicio',     label: 'Nro. de Juicio',       opciones: ['2025-00314-CI-01','2025-00287-CO-02','2024-01102-CI-03','2024-00956-LA-01','2025-00401-CO-04','2025-00198-CI-02','2023-00512-CI-05','2023-00318-LA-03','2023-00445-CO-06'] },
    { id: 'nroExpediente', label: 'Nro. de Expediente',   opciones: ['EXP-2025-0314','EXP-2025-0287','EXP-2024-1102','EXP-2024-0956','EXP-2025-0401','EXP-2025-0198','EXP-2023-0512','EXP-2023-0318','EXP-2023-0445'] },
    { id: 'abogado',       label: 'Abogado',               opciones: ['Dra. M. Rodríguez', 'Dr. C. Pérez', 'Dra. A. López', 'Dr. J. García', 'Dra. P. Flores'] },
    { id: 'tipoProceso',   label: 'Tipo de Proceso',       opciones: ['Cobranza', 'Civil', 'Laboral', 'Penal'] },
    { id: 'entidad',       label: 'Entidad',               opciones: ['BCP S.A.', 'Scotiabank', 'Interbank', 'BBVA Perú'] },
    { id: 'etapa',         label: 'Etapa Procesal',        opciones: ['Actos Preparatorios', 'Etapa Postulatoria', 'Etapa Probatoria', 'Etapa Decisoria', 'Etapa de Ejecución'] },
    { id: 'estado',        label: 'Estado del Caso',       opciones: ['Vigente', 'Por Vencer', 'Vencido', 'No Impulso – Banco', 'Casación'] },
  ];

  getFiltroAvLabel(id: string): string {
    const sel = this.filtroAvSel[id];
    if (!sel?.length) return 'Todos';
    return sel.length === 1 ? sel[0] : `${sel.length} seleccionados`;
  }

  getFiltroAvOpciones(id: string, opciones: string[]): string[] {
    const q = (this.filtroAvSearch[id] ?? '').toLowerCase();
    return q ? opciones.filter(o => o.toLowerCase().includes(q)) : opciones;
  }

  isFiltroAvSel(id: string, op: string): boolean {
    return (this.filtroAvSel[id] ?? []).includes(op);
  }

  toggleFiltroAvOpcion(id: string, op: string) {
    const cur = this.filtroAvSel[id] ?? [];
    this.filtroAvSel[id] = cur.includes(op) ? cur.filter(o => o !== op) : [...cur, op];
  }

  isTodoFiltroAvSel(id: string, opciones: string[]): boolean {
    const sel = this.filtroAvSel[id] ?? [];
    return opciones.every(o => sel.includes(o));
  }

  toggleTodoFiltroAv(id: string, opciones: string[]) {
    this.filtroAvSel[id] = this.isTodoFiltroAvSel(id, opciones) ? [] : [...opciones];
  }

  toggleFiltroAvDrop(id: string) {
    this.filtroAvOpenId.set(this.filtroAvOpenId() === id ? null : id);
  }

  limpiarFiltrosAv() {
    this.filtroAvSel = {};
    this.filtroAvSearch = {};
  }

  aplicarFiltrosAv() { this.filtrosAvOpen.set(false); }

  // ── Información Adicional: gestión de ítems ───────────────────
  agregarInfoAdicional() {
    if (this.infoAdicionalItems().length >= 15) {
      this.showToastMsg('Máximo 15 datos permitidos');
      return;
    }
    this.infoAdicionalItems.update(items => [...items, { id: Date.now(), tipo: '', descripcion: '' }]);
  }

  eliminarInfoAdicional(id: number) {
    this.infoAdicionalItems.update(items => items.filter(i => i.id !== id));
  }

  toggleInfoAdicionalDrop(id: number) {
    this.infoAdicionalDropOpen.update(v => v === id ? null : id);
  }

  setInfoAdicionalTipo(id: number, tipo: string) {
    this.infoAdicionalItems.update(items => items.map(i => i.id === id ? { ...i, tipo } : i));
    this.infoAdicionalDropOpen.set(null);
  }

  setInfoAdicionalDesc(id: number, descripcion: string) {
    this.infoAdicionalItems.update(items => items.map(i => i.id === id ? { ...i, descripcion } : i));
  }


  // ── OnDestroy ─────────────────────────────────────────────────────────────
  ngOnDestroy() {
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this.chartInstances.forEach(chart => {
      if (chart) chart.destroy();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //   STATIC DATA
  // ═══════════════════════════════════════════════════════════════════════════

  readonly notificaciones: Notificacion[] = [
    { color: 'bg-red-400',   titulo: 'Proceso Vencido',    proceso: 'C-2024-0956', hora: 'Hoy · 05:00 a.m.' },
    { color: 'bg-red-400',   titulo: 'Proceso Vencido',    proceso: 'C-2023-0209', hora: 'Hoy · 05:00 a.m.' },
    { color: 'bg-amber-400', titulo: 'Proceso Por Vencer', proceso: 'C-2024-1102', hora: 'Hoy · 05:00 a.m.' },
    { color: 'bg-amber-400', titulo: 'Proceso Por Vencer', proceso: 'C-2023-0318', hora: 'Hoy · 05:00 a.m.' },
    { color: 'bg-amber-400', titulo: 'Proceso Por Vencer', proceso: 'C-2024-0788', hora: 'Hoy · 05:00 a.m.' },
  ];

  readonly abogadoStats: AbogadoStat[] = [
    { semaforo: 'verde',    nombre: 'Dra. M. Rodríguez', pct: 78 },
    { semaforo: 'amarillo', nombre: 'Dr. C. Pérez',      pct: 64 },
    { semaforo: 'verde',    nombre: 'Dra. A. López',     pct: 72 },
    { semaforo: 'amarillo', nombre: 'Dr. J. García',     pct: 58 },
    { semaforo: 'rojo',     nombre: 'Dra. P. Flores',    pct: 43 },
  ];

  readonly actualizaciones: ActualizacionAbogado[] = [
    { semaforo: 'verde',    nombre: 'Dra. M. Rodríguez', procesos: 245, actualizados: 38, pct: '15.5%', badgeClass: 'badge-vigente' },
    { semaforo: 'amarillo', nombre: 'Dr. C. Pérez',      procesos: 312, actualizados: 45, pct: '14.4%', badgeClass: 'badge-por-vencer' },
    { semaforo: 'verde',    nombre: 'Dra. A. López',     procesos: 198, actualizados: 29, pct: '14.6%', badgeClass: 'badge-vigente' },
    { semaforo: 'amarillo', nombre: 'Dr. J. García',     procesos: 189, actualizados: 31, pct: '16.4%', badgeClass: 'badge-vigente' },
    { semaforo: 'rojo',     nombre: 'Dra. P. Flores',    procesos: 125, actualizados: 8,  pct: '6.4%',  badgeClass: 'badge-vencido' },
  ];

  readonly bitacoraSemanal: BitacoraSemanal[] = [
    { nroCaso: 'C-2025-0314', abogado: 'M. Rodríguez', etapa: 'Decisoria',    etapaBadge: 'badge-concluido',  fecha: '12/05/2025' },
    { nroCaso: 'C-2025-0287', abogado: 'C. Pérez',     etapa: 'Ejecución',    etapaBadge: 'badge-vigente',    fecha: '12/05/2025' },
    { nroCaso: 'C-2024-1102', abogado: 'A. López',     etapa: 'Probatoria',   etapaBadge: 'badge-por-vencer', fecha: '11/05/2025' },
    { nroCaso: 'C-2024-0956', abogado: 'J. García',    etapa: 'Postulatoria', etapaBadge: 'badge-vencido',    fecha: '11/05/2025' },
    { nroCaso: 'C-2025-0401', abogado: 'P. Flores',    etapa: 'Actos Prep.',  etapaBadge: 'badge-sin-impulso',fecha: '10/05/2025' },
  ];

  readonly casosConcluidos: CasoConcluido[] = [
    { nroCaso: 'C-2025-0201', abogado: 'Dra. M. Rodríguez', tipo: 'Cobranza', motivoCierre: 'Pago Total',          motivoBadge: 'badge-vigente',    fechaCierre: '10/05/2025', estadoFile: 'Completo',        fileBadge: 'badge-vigente' },
    { nroCaso: 'C-2024-1534', abogado: 'Dr. C. Pérez',      tipo: 'Civil',    motivoCierre: 'Sentencia Favorable', motivoBadge: 'badge-concluido',  fechaCierre: '08/05/2025', estadoFile: 'Completo',        fileBadge: 'badge-vigente' },
    { nroCaso: 'C-2024-1188', abogado: 'Dra. A. López',     tipo: 'Laboral',  motivoCierre: 'Acuerdo Extrajud.',   motivoBadge: 'badge-por-vencer', fechaCierre: '05/05/2025', estadoFile: 'Incompleto',      fileBadge: 'badge-por-vencer' },
    { nroCaso: 'C-2023-0876', abogado: 'Dr. J. García',     tipo: 'Cobranza', motivoCierre: 'Archivo',             motivoBadge: 'badge-sin-impulso',fechaCierre: '02/05/2025', estadoFile: 'Pend. Digital.',  fileBadge: 'badge-vencido' },
  ];

  readonly gastosResumen: GastoResumen[] = [
   { nroCaso: 'C-2025-0314', abogado: 'M. Rodríguez', categoria: 'Judicial',      gastoTotal: 'S/ 3,200', montoAprobado: 'S/ 2,800', montoClass: 'text-green-600', estado: 'Aprobado',  estadoBadge: 'badge-vigente' },
   { nroCaso: 'C-2025-0287', abogado: 'C. Pérez',     categoria: 'Administrativo', gastoTotal: 'S/ 1,450', montoAprobado: 'S/ 0',        montoClass: 'text-amber-600', estado: 'Pendiente', estadoBadge: 'badge-por-vencer' },
   { nroCaso: 'C-2024-1102', abogado: 'A. López',     categoria: 'Peritos',        gastoTotal: 'S/ 5,800', montoAprobado: 'S/ 5,800', montoClass: 'text-green-600', estado: 'Aprobado',  estadoBadge: 'badge-vigente' },
   { nroCaso: 'C-2024-0956', abogado: 'J. García',    categoria: 'Notarial',       gastoTotal: 'S/ 920',   montoAprobado: 'S/ 0',        montoClass: 'text-red-500',   estado: 'Rechazado', estadoBadge: 'badge-vencido' },
  ];

  casosJudiciales: CasoJudicial[] = [
    { starred: false,  nroCaso: 'C-2025-001', nroFile: 'FILE-2025-0001', abogado: 'A. Vega',           cliente: 'María García López',           entidad: 'Natural',  tipo: 'Cobranza', tipoBadge: 'badge-vigente',    etapa: 'Etapa Decisoria',    estado: 'Liquidado',         estadoBadge: 'badge-liquidado',    pct: 100, semaforoCls: 'semaforo-verde',    financiero: 'Liquidado',   financieroBadge: 'badge-liquidado',   plazo: '0 días',   plazoClass: 'text-brand-muted' },
    { starred: false,  nroCaso: 'C-2025-002', nroFile: 'FILE-2025-0002', abogado: 'M. Quispe',          cliente: 'Juan Pérez',                   entidad: 'Natural',  tipo: 'Cobranza', tipoBadge: 'badge-vigente',    etapa: 'Etapa de Ejecución', estado: 'En Cobranza',       estadoBadge: 'badge-en-cobranza',  pct: 50,  semaforoCls: 'semaforo-amarillo', financiero: 'En Cobranza', financieroBadge: 'badge-en-cobranza', plazo: '32 días',  plazoClass: 'text-brand-muted' },

    { starred: true,  nroCaso: 'C-2025-0314', nroFile: 'FILE-2025-0087', abogado: 'Dra. M. Rodríguez', cliente: 'BCP S.A.',                     entidad: 'Banco',    tipo: 'Cobranza', tipoBadge: 'badge-concluido',  etapa: 'Etapa Decisoria',    estado: 'Vigente',           estadoBadge: 'badge-vigente',      pct: 82,  semaforoCls: 'semaforo-verde',    financiero: 'En Cobranza', financieroBadge: 'badge-en-cobranza', plazo: '18 días',  plazoClass: 'text-brand-muted' },
    { starred: false, nroCaso: 'C-2025-0287', nroFile: 'FILE-2025-0061', abogado: 'Dr. C. Pérez',      cliente: 'BCP S.A.',                     entidad: 'Banco',    tipo: 'Cobranza', tipoBadge: 'badge-concluido',  etapa: 'Etapa de Ejecución', estado: 'Vigente',           estadoBadge: 'badge-vigente',      pct: 91,  semaforoCls: 'semaforo-verde',    financiero: 'Liquidable',  financieroBadge: 'badge-liquidable',  plazo: '32 días',  plazoClass: 'text-brand-muted' },
    { starred: false, nroCaso: 'C-2024-1102', nroFile: 'FILE-2024-0298', abogado: 'Dra. A. López',     cliente: 'BCP S.A.',                     entidad: 'Banco',    tipo: 'Civil',    tipoBadge: 'badge-por-vencer', etapa: 'Etapa Probatoria',   estado: 'Por Vencer',        estadoBadge: 'badge-por-vencer',   pct: 55,  semaforoCls: 'semaforo-amarillo', financiero: 'En Cobranza', financieroBadge: 'badge-en-cobranza', plazo: '5 días',   plazoClass: 'text-amber-600 font-semibold' },
    { starred: false, nroCaso: 'C-2024-0956', nroFile: 'FILE-2024-0201', abogado: 'Dr. J. García',     cliente: 'BCP S.A.',                     entidad: 'Banco',    tipo: 'Cobranza', tipoBadge: 'badge-concluido',  etapa: 'Etapa Postulatoria', estado: 'Vencido',           estadoBadge: 'badge-vencido',      pct: 28,  semaforoCls: 'semaforo-rojo',     financiero: 'En Cobranza', financieroBadge: 'badge-en-cobranza', plazo: '-12 días', plazoClass: 'text-red-500 font-semibold' },
    { starred: false, nroCaso: 'C-2025-0401', nroFile: 'FILE-2025-0112', abogado: 'Dra. P. Flores',    cliente: 'BCP S.A.',                     entidad: 'Banco',    tipo: 'Cobranza', tipoBadge: 'badge-concluido',  etapa: 'Actos Preparatorios',estado: 'No Impulso – Banco',estadoBadge: 'badge-no-impulso',   pct: 12,  semaforoCls: 'semaforo-rojo',     financiero: 'En Cobranza', financieroBadge: 'badge-en-cobranza', plazo: '45 días',  plazoClass: 'text-brand-muted' },
    { starred: true,  nroCaso: 'C-2024-0876', nroFile: 'FILE-2024-0178', abogado: 'Dra. M. Rodríguez', cliente: 'BCP S.A.',                     entidad: 'Banco',    tipo: 'Cobranza', tipoBadge: 'badge-concluido',  etapa: 'Etapa de Ejecución', estado: 'Casación',           estadoBadge: 'badge-casacion',     pct: 88,  semaforoCls: 'semaforo-verde',    financiero: 'Liquidado',   financieroBadge: 'badge-liquidado',   plazo: '60 días',  plazoClass: 'text-brand-muted' },
    { starred: false, nroCaso: 'C-2023-0512', nroFile: 'FILE-2023-0134', abogado: 'Dr. C. Pérez',      cliente: 'Inmobiliaria Pacheco S.A.C.',  entidad: 'Empresa',  tipo: 'Civil',    tipoBadge: 'badge-vigente',    etapa: 'Etapa Impugnatoria', estado: 'Vigente',           estadoBadge: 'badge-vigente',      pct: 74,  semaforoCls: 'semaforo-verde',    financiero: 'En Cobranza', financieroBadge: 'badge-en-cobranza', plazo: '27 días',  plazoClass: 'text-brand-muted' },
    { starred: false, nroCaso: 'C-2023-0318', nroFile: 'FILE-2023-0089', abogado: 'Dra. A. López',     cliente: 'Carlos Alberto Mendoza',       entidad: 'Natural',  tipo: 'Laboral',  tipoBadge: 'badge-vencido',    etapa: 'Etapa Decisoria',    estado: 'Por Vencer',        estadoBadge: 'badge-por-vencer',   pct: 61,  semaforoCls: 'semaforo-amarillo', financiero: 'En Cobranza', financieroBadge: 'badge-en-cobranza', plazo: '9 días',   plazoClass: 'text-amber-600 font-semibold' },
  ];

  readonly bitacoraRows: BitacoraRow[] = [
    { nroCaso:'C-2025-0314', nroFile:'F-2025-001', nroJuicio:'2025-00314-CI-01', abogado:'M. Rodríguez', funcionario:'Pepe el Grillo',   entidad:'BCP',       clienteNombre:'AMPUERO CORDOVA DIEGO JOSE',    tipo:'banco',   cuenta:'1001920000000009652961', tipoProceso:'Cobranza',  juzgado:'3er Juzg. Civil Lima',          expediente:'EXP-2025-0314', etapa:'Etapa Decisoria',    subEstado:'En Revisión', estado:'Vigente',    estadoBadge:'badge-vigente',    creadoPor:'Administrador sigcomt', fechaAsignacion:'07/05/2026', fechaActoPrep:'15/01/2025', montoDemanda:'S/ 45,000.00', plazo:'18 días', plazoClass:'text-brand-muted',                   ultimaAct:'12/05/2026', entradas:24, infoAdicionalTipo:'Inmueble', infoAdicionalDesc:'MANZANA I, LOTE 24, URB. VILLA CLUB, SEGUNDA ETAPA, DISTRITO DE CARABAYLLO, PROVINCIA Y DEPARTAMENTO DE LIMA, INSCRITO EN LA PARTIDA ELECTRÓNICA NRO. 13025685 DEL REGISTRO DE PROPIEDAD INMUEBLE DE LIMA' },
    { nroCaso:'C-2025-0314', nroFile:'F-2025-002', nroJuicio:'2025-00314-CI-01', abogado:'M. Rodríguez', funcionario:'Pepe el Grillo',   entidad:'BCP',       clienteNombre:'AMPUERO CORDOVA DIEGO JOSE',    tipo:'banco',   cuenta:'1001920000000012345678', tipoProceso:'Cobranza',  juzgado:'3er Juzg. Civil Lima',          expediente:'EXP-2025-0314', etapa:'Etapa Decisoria',    subEstado:'En Revisión', estado:'Vigente',    estadoBadge:'badge-vigente',    creadoPor:'Administrador sigcomt', fechaAsignacion:'07/05/2026', fechaActoPrep:'15/01/2025', montoDemanda:'S/ 12,500.00', plazo:'18 días', plazoClass:'text-brand-muted',                   ultimaAct:'12/05/2026', entradas:12, infoAdicionalTipo:'Inmueble', infoAdicionalDesc:'MANZANA I, LOTE 24, URB. VILLA CLUB, SEGUNDA ETAPA, DISTRITO DE CARABAYLLO, PROVINCIA Y DEPARTAMENTO DE LIMA, INSCRITO EN LA PARTIDA ELECTRÓNICA NRO. 13025685 DEL REGISTRO DE PROPIEDAD INMUEBLE DE LIMA' },
    { nroCaso:'C-2025-0287', nroFile:'F-2025-003', nroJuicio:'2025-00287-CO-02', abogado:'C. Pérez',     funcionario:'Ana Gutiérrez',   entidad:'BCP',       clienteNombre:'LOAYZA GARCIA CESAR ALEXSI',    tipo:'banco',   cuenta:'1001920000000009870001', tipoProceso:'Cobranza',  juzgado:'5to Juzg. Comercial Lima',      expediente:'EXP-2025-0287', etapa:'Etapa de Ejecución', subEstado:'',            estado:'Vigente',    estadoBadge:'badge-vigente',    creadoPor:'sigcomt Administrador',  fechaAsignacion:'03/03/2026', fechaActoPrep:'10/11/2024', montoDemanda:'S/ 89,300.00', plazo:'32 días', plazoClass:'text-brand-muted',                   ultimaAct:'11/05/2026', entradas:31, infoAdicionalTipo:'Vehículo',  infoAdicionalDesc:'VEHICULO MARCA TOYOTA, MODELO HILUX, AÑO 2021, PLACA ABC-123, INSCRITO EN EL REGISTRO DE PROPIEDAD VEHICULAR DE LIMA' },
    { nroCaso:'C-2024-1102', nroFile:'F-2024-088', nroJuicio:'2024-01102-CI-03', abogado:'A. López',     funcionario:'Roberto Salas',   entidad:'Scotiabank', clienteNombre:'HIGUCHI MIYASATO DAVID MANUEL', tipo:'banco',   cuenta:'0310000012345600',      tipoProceso:'Civil',     juzgado:'8vo Juzg. Civil Lima',          expediente:'EXP-2024-1102', etapa:'Etapa Probatoria',   subEstado:'',            estado:'Por Vencer', estadoBadge:'badge-por-vencer', creadoPor:'Castillo Gino',         fechaAsignacion:'18/06/2025', fechaActoPrep:'05/08/2024', montoDemanda:'S/ 28,750.00', plazo:'5 días',  plazoClass:'text-amber-600 font-semibold',        ultimaAct:'10/05/2026', entradas:18, infoAdicionalTipo:'Cuenta Corriente', infoAdicionalDesc:'CUENTA CORRIENTE NRO. 0310000012345600, MONEDA SOLES, SALDO EMBARGABLE ESTIMADO: S/ 28,750.00' },
    { nroCaso:'C-2024-0956', nroFile:'F-2024-041', nroJuicio:'2024-00956-LA-01', abogado:'J. García',    funcionario:'Carmen Soto',     entidad:'BCP',       clienteNombre:'LARA AGUILAR ROSA',             tipo:'banco',   cuenta:'1910000000043211',      tipoProceso:'Cobranza',  juzgado:'2do Juzg. Laboral Lima',        expediente:'EXP-2024-0956', etapa:'Etapa Postulatoria', subEstado:'',            estado:'Vencido',    estadoBadge:'badge-vencido',    creadoPor:'sigcomt Administrador',  fechaAsignacion:'14/04/2025', fechaActoPrep:'20/06/2024', montoDemanda:'S/ 15,200.00', plazo:'-12 días',plazoClass:'text-red-500 font-semibold',          ultimaAct:'08/05/2026', entradas:12, infoAdicionalTipo:'',                 infoAdicionalDesc:'' },
    { nroCaso:'C-2025-0401', nroFile:'F-2025-018', nroJuicio:'2025-00401-CO-04', abogado:'P. Flores',    funcionario:'Luis Mamani',     entidad:'Interbank',  clienteNombre:'ALLPAS CERRON ROBERTO CARLOS',  tipo:'banco',   cuenta:'2001000045678900',      tipoProceso:'Cobranza',  juzgado:'4to Juzg. Comercial Lima',      expediente:'EXP-2025-0401', etapa:'Actos Preparatorios',subEstado:'',            estado:'Sin Impulso', estadoBadge:'badge-sin-impulso',creadoPor:'Administrador sigcomt', fechaAsignacion:'28/02/2026', fechaActoPrep:'',           montoDemanda:'S/ 7,600.00',  plazo:'45 días', plazoClass:'text-brand-muted',                   ultimaAct:'07/05/2026', entradas:6,  infoAdicionalTipo:'',                 infoAdicionalDesc:'' },
    { nroCaso:'C-2025-0198', nroFile:'F-2025-009', nroJuicio:'2025-00198-CI-02', abogado:'L. Torres',    funcionario:'Marcia Quispe',   entidad:'BBVA Perú',  clienteNombre:'MENDOZA VARGAS JOSE LUIS',      tipo:'banco',   cuenta:'0011000123456789',      tipoProceso:'Civil',     juzgado:'6to Juzg. Civil Lima',          expediente:'EXP-2025-0198', etapa:'Etapa Decisoria',    subEstado:'Sentencia',   estado:'Vigente',    estadoBadge:'badge-vigente',    creadoPor:'Torres Luis',           fechaAsignacion:'12/01/2026', fechaActoPrep:'03/09/2025', montoDemanda:'S/ 134,000.00','plazo':'60 días', plazoClass:'text-brand-muted',                   ultimaAct:'03/05/2026', entradas:28, infoAdicionalTipo:'Departamento', infoAdicionalDesc:'DEPARTAMENTO NRO. 502, EDIFICIO LOS OLIVOS, AV. JAVIER PRADO ESTE 2850, DISTRITO SAN BORJA, LIMA. PARTIDA NRO. P07064823 DEL REGISTRO DE PROPIEDAD INMUEBLE DE LIMA' },
    { nroCaso:'C-2023-0512', nroFile:'F-2023-067', nroJuicio:'2023-00512-CI-05', abogado:'C. Pérez',     funcionario:'Sandra Vargas',   entidad:'Inmobiliaria Pacheco S.A.C.', clienteNombre:'INMOBILIARIA PACHECO S.A.C.', tipo:'empresa', cuenta:null,                    tipoProceso:'Civil',     juzgado:'1er Juzg. Comercial Lima',      expediente:'EXP-2023-0512', etapa:'Etapa Impugnatoria', subEstado:'Apelación',   estado:'Vigente',    estadoBadge:'badge-vigente',    creadoPor:'Pérez Carlos',          fechaAsignacion:'09/07/2024', fechaActoPrep:'22/03/2023', montoDemanda:'S/ 320,000.00','plazo':'27 días', plazoClass:'text-brand-muted',                   ultimaAct:'04/05/2026', entradas:35, infoAdicionalTipo:'Local Comercial', infoAdicionalDesc:'LOCAL COMERCIAL NRO. 12, CENTRO COMERCIAL PLAZA LIMA SUR, AV. DEFENSORES DEL MORRO S/N, DISTRITO CHORRILLOS, LIMA' },
    { nroCaso:'C-2023-0318', nroFile:'F-2023-089', nroJuicio:'2023-00318-LA-03', abogado:'A. López',     funcionario:'Pedro Castillo',  entidad:'Carlos Alberto Mendoza', clienteNombre:'CARLOS ALBERTO MENDOZA HUANCA', tipo:'natural', cuenta:null,               tipoProceso:'Laboral',   juzgado:'3er Juzg. Laboral Lima',        expediente:'EXP-2023-0318', etapa:'Etapa Decisoria',    subEstado:'',            estado:'Por Vencer', estadoBadge:'badge-por-vencer', creadoPor:'López Ana',             fechaAsignacion:'15/08/2024', fechaActoPrep:'01/06/2023', montoDemanda:'S/ 45,800.00', plazo:'9 días',  plazoClass:'text-amber-600 font-semibold',        ultimaAct:'05/05/2026', entradas:21, infoAdicionalTipo:'',                 infoAdicionalDesc:'' },
    { nroCaso:'C-2023-0445', nroFile:'F-2023-112', nroJuicio:'2023-00445-CO-06', abogado:'R. Mamani',    funcionario:'Claudia Reyes',   entidad:'Scotiabank', clienteNombre:'QUISPE MENDOZA FELIX AUGUSTO',  tipo:'banco',   cuenta:'0310000098765400',      tipoProceso:'Cobranza',  juzgado:'7mo Juzg. Comercial Lima',      expediente:'EXP-2023-0445', etapa:'Fin del Proceso',    subEstado:'Concluido',   estado:'Concluido',  estadoBadge:'badge-concluido',  creadoPor:'Mamani Rodrigo',        fechaAsignacion:'22/03/2023', fechaActoPrep:'10/01/2023', montoDemanda:'S/ 67,400.00', plazo:'—',       plazoClass:'text-brand-muted',                   ultimaAct:'01/05/2026', entradas:43, infoAdicionalTipo:'',                 infoAdicionalDesc:'', motivoCierre:'Pago Total', estadoFile:'Completo', comentarioCierre:'Cliente regularizó la totalidad de la deuda mediante pago en cuotas. Se emite constancia de pago y se solicita archivo definitivo.', fechaRetiro:'28/04/2026', fechaDevolucion:'05/05/2026' },
  ];

  bitacoraComentarios = signal<BitacoraComment[]>([
    { nroCaso:'C-2025-0314', nro:1, fecha:'01/06/2026', etapa:'ETAPA DECISORIA',    descripcion:'Comentario de Prueba',                                                             subEstado:'',          creadoPor:'Administrador sigcomt' },
    { nroCaso:'C-2025-0314', nro:2, fecha:'01/06/2026', etapa:'ETAPA DECISORIA',    descripcion:'xasasas a s asasa',                                                                subEstado:'',          creadoPor:'Administrador sigcomt' },
    { nroCaso:'C-2025-0314', nro:3, fecha:'01/06/2026', etapa:'ETAPA DECISORIA',    descripcion:'JOEL CASTILLO',                                                                    subEstado:'',          creadoPor:'Administrador sigcomt' },
    { nroCaso:'C-2025-0314', nro:4, fecha:'10/05/2026', etapa:'ETAPA PROBATORIA',   descripcion:'Juez solicitó ampliación de peritos. Se coordinará con el perito titular.',       subEstado:'Pendiente', creadoPor:'M. Rodríguez'          },
    { nroCaso:'C-2025-0287', nro:1, fecha:'11/05/2026', etapa:'ETAPA DE EJECUCIÓN', descripcion:'Mandato de embargo notificado a la entidad bancaria.',                             subEstado:'',          creadoPor:'sigcomt Administrador'  },
    { nroCaso:'C-2025-0287', nro:2, fecha:'28/04/2026', etapa:'ETAPA DE EJECUCIÓN', descripcion:'Entidad bancaria reportó saldo insuficiente. Se evalúan otros bienes embargables.',subEstado:'Pendiente', creadoPor:'C. Pérez'               },
    { nroCaso:'C-2024-1102', nro:1, fecha:'10/05/2026', etapa:'ETAPA PROBATORIA',   descripcion:'Se presentó escrito de subsanación antes del vencimiento del plazo.',              subEstado:'',          creadoPor:'Castillo Gino'          },
    { nroCaso:'C-2024-0956', nro:1, fecha:'08/05/2026', etapa:'ETAPA POSTULATORIA', descripcion:'Comentario para validar desde bitacora',                                           subEstado:'',          creadoPor:'sigcomt Administrador'  },
    { nroCaso:'C-2023-0445', nro:1, fecha:'28/04/2026', etapa:'FIN DEL PROCESO',    descripcion:'Cliente realizó pago total de la deuda. Se procede con el archivo definitivo.',   subEstado:'Concluido', creadoPor:'Mamani Rodrigo'         },
    { nroCaso:'C-2023-0445', nro:2, fecha:'15/03/2026', etapa:'ETAPA DE EJECUCIÓN', descripcion:'Se notificó resolución de embargo a Scotiabank. Saldo embargado: S/ 67,400.00.',   subEstado:'',          creadoPor:'Mamani Rodrigo'         },
  ]);

  procesosConcluidos: ProcesoConcluido[] = [
    { nroCaso: 'C-2025-0314', entidad: 'BCP S.A.',                    tipo: 'banco',   cuentaFile: 'Cta. 001 · FILE-2025-0087', abogado: 'Dra. M. Rodríguez', tipoProceso: 'Cobranza', motivoCierre: 'Pago Total',          motivoBadge: 'badge-vigente',    fechaCierre: '10/05/2025', estadoFile: 'Completo',      fileBadge: 'badge-vigente' },
    { nroCaso: 'C-2024-1102', entidad: 'BCP S.A.',                    tipo: 'banco',   cuentaFile: 'Cta. 001 · FILE-2024-0341', abogado: 'Dra. A. López',     tipoProceso: 'Civil',    motivoCierre: 'Sentencia Favorable', motivoBadge: 'badge-concluido',  fechaCierre: '08/05/2025', estadoFile: 'Completo',      fileBadge: 'badge-vigente' },
    { nroCaso: 'C-2024-1102', entidad: 'BCP S.A.',                    tipo: 'banco',   cuentaFile: 'Cta. 003 · FILE-2024-0343', abogado: 'Dra. A. López',     tipoProceso: 'Civil',    motivoCierre: 'Acuerdo Extrajud.',   motivoBadge: 'badge-por-vencer', fechaCierre: '08/05/2025', estadoFile: 'Pend. Digital.',fileBadge: 'badge-por-vencer' },
    { nroCaso: 'C-2024-0956', entidad: 'BCP S.A.',                    tipo: 'banco',   cuentaFile: 'Cta. 001 · FILE-2024-0211', abogado: 'Dr. J. García',     tipoProceso: 'Cobranza', motivoCierre: 'Archivo',             motivoBadge: 'badge-sin-impulso',fechaCierre: '#02/05/2025', estadoFile: 'Pend. Digital.',fileBadge: 'badge-vencido' },
    { nroCaso: 'C-2023-0512', entidad: 'Inmobiliaria Pacheco S.A.C.', tipo: 'empresa', cuentaFile: 'FILE-2023-0134',             abogado: 'Dr. C. Pérez',      tipoProceso: 'Civil',    motivoCierre: 'Sentencia Favorable', motivoBadge: 'badge-concluido',  fechaCierre: '05/05/2025', estadoFile: 'Completo',      fileBadge: 'badge-vigente' }
  ];

  readonly evData: Evento[] = [
    { id: 1,  titulo: 'Audiencia de pruebas — BCP S.A.',           tipo: 'audiencia',   caso: 'C-2025-0314', usuario: 'M. Rodríguez', fecha: '2026-05-05', hi: '09:00', hf: '11:00', lugar: 'Sala 3 — Juzgado Civil Lima',           desc: 'Audiencia de actuación de medios probatorios. Asistirán peritos contables y representante de BCP.' },
    { id: 2,  titulo: 'Vencimiento plazo — Etapa Probatoria',      tipo: 'vencimiento', caso: 'C-2024-1102', usuario: 'A. López',     fecha: '2026-05-07', hi: '23:59', hf: '23:59', lugar: '—',                                     desc: 'Vence el plazo de la etapa probatoria. Presentar escrito de subsanación antes de las 23:59.' },
    { id: 3,  titulo: 'Diligencia de embargo — Scotiabank',        tipo: 'diligencia',  caso: 'C-2024-1102', usuario: 'A. López',     fecha: '2026-05-08', hi: '10:30', hf: '12:00', lugar: 'Of. Scotiabank, Av. Javier Prado 1234', desc: 'Diligencia de embargo de cuentas corrientes y depósitos a plazo.' },
    { id: 4,  titulo: 'Reunión de estrategia — caso Interbank',    tipo: 'reunion',     caso: 'C-2025-0401', usuario: 'P. Flores',    fecha: '2026-05-12', hi: '08:00', hf: '09:00', lugar: 'Sala de reuniones — Oficina principal',  desc: 'Coordinación de estrategia procesal. Revisión de cronograma de etapas y distribución de tareas.' },
    { id: 5,  titulo: 'Audiencia única — C-2024-0956',             tipo: 'audiencia',   caso: 'C-2024-0956', usuario: 'J. García',    fecha: '2026-05-12', hi: '15:00', hf: '17:00', lugar: 'Sala 7 — Juzgado Laboral Lima',          desc: 'Audiencia única de conciliación y juzgamiento en proceso laboral.' },
    { id: 6,  titulo: 'Capacitación interna — Reforma procesal',   tipo: 'interno',     caso: null,          usuario: 'Administrador',fecha: '2026-05-13', hi: '13:00', hf: '15:00', lugar: 'Sala de capacitación — Piso 4',          desc: 'Taller sobre las últimas modificaciones al Código Procesal Civil. Asistencia obligatoria para todos los abogados.' },
    { id: 7,  titulo: 'Audiencia de sentencia — BBVA Perú',        tipo: 'audiencia',   caso: 'C-2025-0198', usuario: 'L. Torres',    fecha: '2026-05-15', hi: '11:00', hf: '12:00', lugar: 'Sala 12 — Corte Superior Lima',         desc: 'Lectura de sentencia en segunda instancia. Se espera resolución favorable.' },
    { id: 8,  titulo: 'Vencimiento — Escrito de apelación',        tipo: 'vencimiento', caso: 'C-2024-0876', usuario: 'M. Rodríguez', fecha: '2026-05-16', hi: '23:59', hf: '23:59', lugar: '—',                                     desc: 'Último día para presentar escrito de fundamentación de apelación ante la Corte Superior.' },
    { id: 9,  titulo: 'Diligencia notarial — BCP S.A.',            tipo: 'diligencia',  caso: 'C-2025-0314', usuario: 'M. Rodríguez', fecha: '2026-05-19', hi: '09:30', hf: '10:30', lugar: 'Notaría Castillo, Jr. de la Unión 456', desc: 'Protocolización de documentos y legalización de firmas para ejecutar la sentencia.' },
    { id: 10, titulo: 'Reunión con cliente — Scotiabank',           tipo: 'reunion',     caso: 'C-2024-1102', usuario: 'A. López',     fecha: '2026-05-19', hi: '16:00', hf: '17:00', lugar: 'Of. Scotiabank — Sede San Isidro',       desc: 'Presentación de informe de avance procesal al funcionario asignado de Scotiabank.' },
    { id: 11, titulo: 'Audiencia pericial — C-2025-0287',          tipo: 'audiencia',   caso: 'C-2025-0287', usuario: 'C. Pérez',     fecha: '2026-05-21', hi: '10:00', hf: '13:00', lugar: 'Sala 2 — Juzgado Comercial Lima',       desc: 'Audiencia de actuación de pericia contable. Declaración de perito titular y alterno.' },
    { id: 12, titulo: 'Vencimiento — Etapa Decisoria BCP',         tipo: 'vencimiento', caso: 'C-2025-0314', usuario: 'M. Rodríguez', fecha: '2026-05-23', hi: '23:59', hf: '23:59', lugar: '—',                                     desc: 'Vence plazo para presentar alegatos finales en la etapa decisoria.' },
    { id: 13, titulo: 'Junta de abogados — planificación mensual', tipo: 'interno',     caso: null,          usuario: 'Administrador',fecha: '2026-05-26', hi: '08:30', hf: '10:00', lugar: 'Sala de directorio — Piso 5',           desc: 'Reunión mensual de seguimiento. Revisión de KPIs, casos críticos y asignación de nuevas cuentas.' },
    { id: 14, titulo: 'Audiencia de vista — C-2023-0512',          tipo: 'audiencia',   caso: 'C-2023-0512', usuario: 'C. Pérez',     fecha: '2026-05-28', hi: '14:00', hf: '15:30', lugar: 'Sala 4 — Corte Superior Lima',          desc: 'Vista de causa en segunda instancia. Informe oral ante el colegiado de la Sala Civil.' },
    { id: 15, titulo: 'Diligencia inspección — C-2023-0318',       tipo: 'diligencia',  caso: 'C-2023-0318', usuario: 'A. López',     fecha: '2026-05-29', hi: '09:00', hf: '11:00', lugar: 'Predio industrial, Av. Argentina 789',  desc: 'Inspección judicial del bien materia de litigio. Acude perito tasador designado por el juzgado.' },
    { id: 16, titulo: 'Vencimiento — presentar liquidación',       tipo: 'vencimiento', caso: 'C-2025-0287', usuario: 'C. Pérez',     fecha: '2026-05-30', hi: '23:59', hf: '23:59', lugar: '—',                                     desc: 'Plazo final para presentar liquidación de intereses y costas procesales al juzgado.' },
  ];

  readonly actDashData: ActualizacionDash[] = [
    { nombre: 'Dra. M. Rodríguez', cambiosBitacora: 24, cambiosEtapa: 8,  totalActualizaciones: 32 },
    { nombre: 'Dr. C. Pérez',      cambiosBitacora: 18, cambiosEtapa: 11, totalActualizaciones: 29 },
    { nombre: 'Dra. A. López',     cambiosBitacora: 15, cambiosEtapa: 6,  totalActualizaciones: 21 },
    { nombre: 'Dr. J. García',     cambiosBitacora: 9,  cambiosEtapa: 4,  totalActualizaciones: 13 },
    { nombre: 'Dra. P. Flores',    cambiosBitacora: 4,  cambiosEtapa: 2,  totalActualizaciones: 6  },
  ];

  readonly bsDashData: BitacoraSemanalDash[] = [
    { nombre: 'Dra. M. Rodríguez', semana1: 9,  semana2: 7,  semana3: 5, semana4: 3,  semana5: 0 },
    { nombre: 'Dr. C. Pérez',      semana1: 6,  semana2: 5,  semana3: 4, semana4: 3,  semana5: 0 },
    { nombre: 'Dra. A. López',     semana1: 5,  semana2: 4,  semana3: 3, semana4: 3,  semana5: 0 },
    { nombre: 'Dr. J. García',     semana1: 3,  semana2: 3,  semana3: 2, semana4: 1,  semana5: 0 },
    { nombre: 'Dra. P. Flores',    semana1: 2,  semana2: 1,  semana3: 1, semana4: 0,  semana5: 0 },
  ];

  // ── Metas ─────────────────────────────────────────────────────────────────

  readonly tareasAMedir: string[] = [
    'Actualización de Bitácora',
    'Avance de Etapas',
    'Casos Concluidos',
    'Gestión de Gastos',
  ];

  readonly abogadosDisponibles: { nombre: string; rol: string; equipo: string; asistente: { nombre: string; rol: string; equipo: string } | null }[] = [
    { nombre: 'Dra. M. Rodríguez', rol: 'Abogado', equipo: 'Equipo A', asistente: { nombre: 'K. Sánchez', rol: 'Asistente', equipo: 'Equipo A' } },
    { nombre: 'Dr. C. Pérez',      rol: 'Abogado', equipo: 'Equipo B', asistente: null },
    { nombre: 'Dra. A. López',     rol: 'Abogado', equipo: 'Equipo A', asistente: { nombre: 'R. Vargas', rol: 'Asistente', equipo: 'Equipo A' } },
    { nombre: 'Dr. J. García',     rol: 'Abogado', equipo: 'Equipo C', asistente: null },
    { nombre: 'Joan Alfaro',       rol: 'Abogado', equipo: '',          asistente: null },
  ];

  metasListData: Meta[] = [
    {
      id: 1, nombre: 'prueba', fechaInicio: '19/05/2026', fechaFin: '31/05/2026',
      tareaAMedir: 'Actualización de Bitácora', cantidadCasos: 5, estado: 'activo',
      integrantes: [
        { id: 1, usuario: 'Joan Alfaro', rol: 'Abogado', equipo: '', avancePct: 0, color: 'rojo' }
      ]
    },
  ];

  readonly historialEficiencia: HistorialEficiencia[] = [
    { id: 1,  meta: 'prueba', abogado: 'Joan Alfaro',       rol: 'Abogado',   periodo: '19/05/2026 – 31/05/2026', casosMeta: 5, casosLogrados: 0, avancePct: 0,  color: 'rojo'     },
    { id: 2,  meta: 'prueba', abogado: 'Dra. M. Rodríguez', rol: 'Abogado',   periodo: '19/05/2026 – 31/05/2026', casosMeta: 5, casosLogrados: 4, avancePct: 80, color: 'verde'    },
    { id: 3,  meta: 'prueba', abogado: 'K. Sánchez',        rol: 'Asistente', periodo: '19/05/2026 – 31/05/2026', casosMeta: 5, casosLogrados: 3, avancePct: 60, color: 'amarillo' },
    { id: 4,  meta: 'prueba', abogado: 'Dra. A. López',     rol: 'Abogado',   periodo: '19/05/2026 – 31/05/2026', casosMeta: 5, casosLogrados: 2, avancePct: 40, color: 'rojo'     },
    { id: 5,  meta: 'prueba', abogado: 'R. Vargas',         rol: 'Asistente', periodo: '19/05/2026 – 31/05/2026', casosMeta: 5, casosLogrados: 3, avancePct: 60, color: 'amarillo' },
    { id: 6,  meta: 'prueba', abogado: 'Dr. C. Pérez',      rol: 'Abogado',   periodo: '19/05/2026 – 31/05/2026', casosMeta: 5, casosLogrados: 5, avancePct: 100,'color': 'verde'  },
  ];

  // ── Historial de eficiencia — filtros y expansión ─────────────────────────
  histFiltroMeta    = signal('');
  histFiltroAbogado = signal('');
  historialExpandedIds = signal<Set<number>>(new Set());

  historialAbogadosFiltrados = computed(() => {
    const meta    = this.histFiltroMeta();
    const abogado = this.histFiltroAbogado();
    return this.historialEficiencia.filter(h => {
      if (h.rol !== 'Abogado') return false;
      if (meta    && h.meta    !== meta)    return false;
      if (abogado && h.abogado !== abogado) return false;
      return true;
    });
  });

  toggleHistorialRow(id: number) {
    this.historialExpandedIds.update(s => {
      const ns = new Set(s);
      if (ns.has(id)) ns.delete(id); else ns.add(id);
      return ns;
    });
  }

  hasAsistenteHistorial(abogadoNombre: string): boolean {
    return !!this.abogadosDisponibles.find(a => a.nombre === abogadoNombre)?.asistente;
  }

  getAsistentesHistorial(abogadoNombre: string, meta: string): HistorialEficiencia[] {
    const ab = this.abogadosDisponibles.find(a => a.nombre === abogadoNombre);
    if (!ab?.asistente) return [];
    return this.historialEficiencia.filter(h => h.abogado === ab.asistente!.nombre && h.meta === meta);
  }

  // ── Metas — filtros y paginación ──────────────────────────────────────────
  metaBuscar       = signal('');
  metaFiltroEstado = signal('todos');
  metaFiltroDesde  = signal('');
  metaFiltroHasta  = signal('');
  metaPage         = signal(0);
  metaPageSize     = signal(5);

  metasFiltradas = computed(() => {
    const buscar = this.metaBuscar().toLowerCase();
    const estado = this.metaFiltroEstado();
    return this.metasListData.filter(m => {
      const matchNombre = !buscar || m.nombre.toLowerCase().includes(buscar);
      const matchEstado = estado === 'todos' || m.estado === estado;
      return matchNombre && matchEstado;
    });
  });

  metasPaginadas = computed(() => {
    const start = this.metaPage() * this.metaPageSize();
    return this.metasFiltradas().slice(start, start + this.metaPageSize());
  });

  metaRangeFin = computed(() => {
    const end = (this.metaPage() + 1) * this.metaPageSize();
    return Math.min(end, this.metasFiltradas().length);
  });

  // ── Metas — formulario ────────────────────────────────────────────────────
  metaShowForm     = signal(false);
  metaEditId       = signal<number | null>(null);
  metaFormNombre   = signal('');
  metaFormFechaDesde = signal('');
  metaFormFechaHasta = signal('');
  metaFormTarea    = signal('');
  metaFormCantidad = signal('');
  metaFormEstado   = signal('activo');
  metaFormVerdeDesde = signal('');
  metaFormAmarDesde  = signal('');
  metaFormAmarHasta  = signal('');
  metaFormRojoHasta  = signal('');
  metaFormBuscarIntegrante = signal('');
  metaFormIntegrantes = signal<MetaIntegrante[]>([]);
  metaFormValidado = signal(false);
  private _metaNextIntId = 100;

  abrirNuevaMeta() {
    this.metaEditId.set(null);
    this.metaFormNombre.set('');
    this.metaFormFechaDesde.set('');
    this.metaFormFechaHasta.set('');
    this.metaFormTarea.set('');
    this.metaFormCantidad.set('');
    this.metaFormEstado.set('activo');
    this.metaFormVerdeDesde.set('');
    this.metaFormAmarDesde.set('');
    this.metaFormAmarHasta.set('');
    this.metaFormRojoHasta.set('');
    this.metaFormBuscarIntegrante.set('');
    this.metaFormIntegrantes.set([]);
    this.metaFormValidado.set(false);
    this.metaShowForm.set(true);
  }

  abrirEditarMeta(meta: Meta) {
    this.metaEditId.set(meta.id);
    this.metaFormNombre.set(meta.nombre);
    this.metaFormTarea.set(meta.tareaAMedir);
    this.metaFormCantidad.set(String(meta.cantidadCasos));
    this.metaFormEstado.set(meta.estado);
    this.metaFormIntegrantes.set([...meta.integrantes]);
    this.metaFormValidado.set(false);
    this.metaShowForm.set(true);
  }

  abrirVerMeta(meta: Meta) {
    this.abrirEditarMeta(meta);
  }

  cancelarMeta() {
    this.metaShowForm.set(false);
  }

  guardarMeta() {
    this.metaFormValidado.set(true);
    if (!this.metaFormNombre()) return;
    const id = this.metaEditId() ?? (this.metasListData.length ? Math.max(...this.metasListData.map(m => m.id)) + 1 : 1);
    const meta: Meta = {
      id,
      nombre: this.metaFormNombre(),
      fechaInicio: this.metaFormFechaDesde() || '—',
      fechaFin: this.metaFormFechaHasta() || '—',
      tareaAMedir: this.metaFormTarea(),
      cantidadCasos: Number(this.metaFormCantidad()) || 0,
      estado: this.metaFormEstado() as 'activo' | 'inactivo',
      integrantes: this.metaFormIntegrantes(),
    };
    if (this.metaEditId()) {
      this.metasListData = this.metasListData.map(m => m.id === id ? meta : m);
    } else {
      this.metasListData = [...this.metasListData, meta];
    }
    this.metaShowForm.set(false);
    this.showToastMsg(this.metaEditId() ? 'Meta actualizada correctamente' : 'Meta creada correctamente');
  }

  agregarIntegrante() {
    const nombre = this.metaFormBuscarIntegrante();
    if (!nombre) return;
    const ab = this.abogadosDisponibles.find(a => a.nombre === nombre);
    if (!ab) return;
    const yaExiste = this.metaFormIntegrantes().some(i => i.usuario === nombre);
    if (yaExiste) return;
    const nuevos: MetaIntegrante[] = [{
      id: this._metaNextIntId++,
      usuario: ab.nombre,
      rol: ab.rol,
      equipo: ab.equipo,
      avancePct: 0,
      color: 'rojo',
    }];
    if (ab.asistente) {
      const yaAsistente = this.metaFormIntegrantes().some(i => i.usuario === ab.asistente!.nombre);
      if (!yaAsistente) {
        nuevos.push({
          id: this._metaNextIntId++,
          usuario: ab.asistente.nombre,
          rol: ab.asistente.rol,
          equipo: ab.asistente.equipo,
          avancePct: 0,
          color: 'rojo',
        });
      }
    }
    this.metaFormIntegrantes.update(list => [...list, ...nuevos]);
    this.metaFormBuscarIntegrante.set('');
  }

  eliminarIntegrante(id: number) {
    this.metaFormIntegrantes.update(list => list.filter(i => i.id !== id));
  }

  getRolAbogado(nombre: string): string {
    return this.abogadosDisponibles.find(a => a.nombre === nombre)?.rol ?? '';
  }

  getEquipoAbogado(nombre: string): string {
    return this.abogadosDisponibles.find(a => a.nombre === nombre)?.equipo ?? '';
  }
}