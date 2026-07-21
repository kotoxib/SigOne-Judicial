import { Component, OnInit, HostListener, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent, TopbarTab } from '../topbar/topbar.component';
import { AuthService } from '../../services/auth.service';
// Estructura de tipado para la configuración de pestañas
interface TabConfigValue {
  subs: string[];
  groups: string[];
  defaultView: string;
}

@Component({
  selector: 'app-gap',
  standalone: true,
  templateUrl: './gap.component.html',
  styleUrls: ['./gap.component.css'],
  imports: [SidebarComponent, TopbarComponent]

})
export class GapComponent implements OnInit {

  private auth = inject(AuthService);
  userName = computed(() => this.auth.obtenerNombreDisplay());

  // ── Topbar tabs ──────────────────────────────────────────────────
  readonly topbarTabs: TopbarTab[] = [
    { key: 'inicio',   label: 'Inicio' },
    { key: 'gestion',  label: 'Gestión Financiera' },
    { key: 'reportes', label: 'Reportes' },
  ];

  // ── Estado Global en Angular ─────────────────────────────────────
  tabActivo: string = 'inicio';
  vistaActiva: string = 'dash-gerencial';
  
  // Control de estados de la UI (Sustituyen los add/remove de clases)
  sidebarExpanded: boolean = true;
  userDropdownOpen: boolean = false;
  
  // Control de Modales (Por ID usando un set o booleanos si son fijos)
  modalesAbiertos: Set<string> = new Set<string>();
  
  // Control de Menús de Acciones en tablas (Guarda el ID del menú abierto)
  menuAccionAbiertoId: string | null = null;
  
  // Control de Toasts
  toastVisible: boolean = false;
  toastMessage: string = '';
  private toastTimer: any;

  // ── Paginación ────────────────────────────────────────────────────────────
  pgSize: number = 5;
  private pages: Map<string, number> = new Map();

  // Configuración del mapa de navegación (Corregido para hacer match con el Sidebar HTML)
  tabConfig: Record<string, TabConfigValue> = {
    inicio: { 
      subs: ['sub-dash-gerencial', 'sub-dash-financiero'], 
      groups: ['sg-inicio'], 
      defaultView: 'dash-gerencial' 
    },
    gestion: { 
      subs: ['sub-gestion-ingresos', 'sub-gestion-gastos', 'sub-liquidacion', 'sub-gestion-procesos'], 
      groups: ['sg-gestion'], 
      defaultView: 'gestion-ingresos' 
    },
    reportes: {
      subs: ['sub-rep-gastos-caso', 'sub-rep-gastos-pend', 'sub-rep-financiero', 'sub-rep-liquidacion', 'sub-rep-gerencial'],
      groups: ['sg-reportes'],
      defaultView: 'rep-gastos-caso'
    }
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // ── Validación de Seguridad (Guard de Autenticación básico) ──
    if (sessionStorage.getItem('auth') !== 'true') {
      this.router.navigate(['/login']);
      return;
    }
    
    // Inicializar el tab por defecto de manera limpia
    this.tabActivo = 'inicio';
    this.vistaActiva = 'dash-gerencial';
  }

  // ── Lógica de Navegación de Pestañas ──────────────────────────────
  cambiarTopbarTab(tab: string): void {
    this.tabActivo = tab;
    const cfg = this.tabConfig[tab];
    if (cfg) {
      this.vistaActiva = cfg.defaultView;
    }
  }

  activarSubNav(tab: string, viewId: string): void {
    // Si hacen clic en un submódulo de un tab que no es el actual, forzamos el cambio
    if (this.tabActivo !== tab) {
      this.tabActivo = tab;
    }
    this.vistaActiva = viewId;
  }

  // Comprobadores auxiliares para usar en las directivas HTML
  isSubNavVisible(subId: string): boolean {
    const currentCfg = this.tabConfig[this.tabActivo];
    return currentCfg ? currentCfg.subs.includes(subId) : false;
  }

  isGroupVisible(groupId: string): boolean {
    const currentCfg = this.tabConfig[this.tabActivo];
    return currentCfg ? currentCfg.groups.includes(groupId) : false;
  }

  // ── Modales, Sidebar y Dropdowns ──────────────────────────────────
  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation(); 
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  openModal(modalId: string): void {
    this.modalesAbiertos.add(modalId);
  }

  closeModal(modalId: string): void {
    this.modalesAbiertos.delete(modalId);
  }

  isModalOpen(modalId: string): boolean {
    return this.modalesAbiertos.has(modalId);
  }

  // ── Menú de Acciones (Tablas) ─────────────────────────────────────
  toggleAcciones(id: string, event: Event): void {
    event.stopPropagation(); 
    if (this.menuAccionAbiertoId === id) {
      this.menuAccionAbiertoId = null;
    } else {
      this.menuAccionAbiertoId = id;
    }
  }

  closeAcciones(): void {
    this.menuAccionAbiertoId = null;
  }

  // ── Feedback (Toasts) ─────────────────────────────────────────────
  showToast(msg: string): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = msg;
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3200);
  }

  getPage(tableId: string): number {
    return this.pages.get(tableId) ?? 1;
  }

  totalPgs(total: number): number {
    return Math.max(1, Math.ceil(total / this.pgSize));
  }

  pageNav(tableId: string, delta: number, total: number): void {
    const current = this.getPage(tableId);
    const next = Math.min(Math.max(1, current + delta), this.totalPgs(total));
    this.pages.set(tableId, next);
  }

  setPgSize(val: string): void {
    this.pgSize = +val;
    this.pages.clear();
  }

  // ── Sesión y Salida ───────────────────────────────────────────────
  handleLogout(): void {
    localStorage.removeItem('auth');
    this.router.navigate(['/login']);
  }

  handleReturn(): void {
    this.router.navigate(['/portal']);
  }

  // ── Escuchador de Clicks Globales ──
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this.userDropdownOpen && !target.closest('.user-dropdown-container')) {
      this.userDropdownOpen = false;
    }

    if (this.menuAccionAbiertoId && !target.closest('.accion-menu') && !target.closest('.btn-acciones-trigger')) {
      this.menuAccionAbiertoId = null;
    }
  }
}