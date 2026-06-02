import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export interface TourStep {
  title: string;
  description: string;
  icon?: string;
  targetId?: string;          // ID del elemento a iluminar (sin #)
  bubblePos?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

@Injectable({ providedIn: 'root' })
export class ProductTourService {
  private router = inject(Router);
  private auth   = inject(AuthService);

  tourActivo  = signal(false);
  pasoActual  = signal(0);
  rutaActual  = signal('portal');
  private _modoCompleto = false;
  private _soloUnPasoParaRuta = false;

  readonly pasosPorRuta: Record<string, TourStep[]> = {
    portal: [
      {
        title: '¡Bienvenido a SIGONE!',
        description: 'Esta es tu malla de aplicaciones. Desde aquí accedes a toda la suite legal de tu plan. Haz clic en Siguiente para conocer cada sección.',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        bubblePos: 'center',
      },
      {
        title: 'Aplicativos',
        description: 'Cada tarjeta es un aplicativo. GAP gestiona tus gastos procesales, GEPDIA analiza documentos con IA y SPJ lleva tus expedientes judiciales.',
        icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
        targetId: 'tour-apps-grid',
        bubblePos: 'top',
      },
      {
        title: 'Tu Plan',
        description: 'Desde aquí puedes ver y gestionar tu suscripción activa, modificar tu método de pago, revisar tu historial de facturas y actualizar opciones de tu plan.',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
        targetId: 'tour-plan-btn',
        bubblePos: 'bottom',
      },
      {
        title: 'Configuración',
        description: 'Aquí configuras tu perfil, actualizas tu contraseña y los datos de tu estudio jurídico.',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        targetId: 'tour-config-btn',
        bubblePos: 'bottom',
      },
    ],
    configuracion: [
      {
        title: 'Tu perfil de usuario',
        description: 'Desde Usuarios puedes actualizar tus datos personales y restablecer tu contraseña cuando lo necesites.',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        targetId: 'tour-nav-usuarios',
        bubblePos: 'right',
      },
      {
        title: 'Clientes',
        description: 'Registra aquí a tus clientes: personas naturales, empresas y entidades bancarias. Estos datos se usarán en tus casos y procesos.',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
        targetId: 'tour-nav-clientes',
        bubblePos: 'right',
      },
      {
        title: 'Tipos de Caso',
        description: 'Define los tipos de procesos judiciales que gestionas: ODSD, EGH, Proceso Abreviado, etc. Cada tipo puede tener montos base configurados.',
        icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
        targetId: 'tour-nav-tiposcaso',
        bubblePos: 'right',
      },
      {
        title: 'Etapas Procesales',
        description: 'Configura las etapas y sub-etapas de tus procesos. Cada caso en SPJ seguirá estas etapas: Actos Preparatorios, Etapa Postulatoria, etc.',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        targetId: 'tour-nav-etapas',
        bubblePos: 'right',
      },
      {
        title: 'Tipos de Gasto',
        description: 'Registra los tipos de gastos que usarás en GAP: honorarios, aranceles, notificaciones, depósitos judiciales, etc.',
        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
        targetId: 'tour-nav-tiposgasto',
        bubblePos: 'right',
      },
      {
        title: 'Personalización',
        description: '¡Listo! Aquí puedes personalizar la apariencia del login con tu logo y colores. El sistema ya está configurado para empezar a trabajar.',
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01',
        targetId: 'tour-personalizacion-header',
        bubblePos: 'bottom',
      },
    ],
    gap: [
      {
        title: 'GAP – Gastos Administrativos',
        description: 'Aquí registras y controlas todos los gastos de tus procesos judiciales. El dashboard mostrará tus métricas financieras en cuanto registres datos.',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
        targetId: 'tour-gap-dashboard',
        bubblePos: 'bottom',
      },
      {
        title: 'Gestión de Ingresos',
        description: 'Registra los ingresos proyectados y reales de cada proceso. Desde aquí controlas la cobranza y el estado financiero de tus casos.',
        targetId: 'tour-gap-ingresos',
        bubblePos: 'right',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
      {
        title: 'Gestión de Gastos',
        description: 'Registra cada gasto del proceso: aranceles, notificaciones, honorarios, depósitos judiciales. Cada gasto queda asociado al proceso y cliente.',
        targetId: 'tour-gap-gastos',
        bubblePos: 'right',
        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      },
    ],
    gepdia: [
      {
        title: 'GEPDIA – Asistente IA Legal',
        description: 'Carga tus documentos legales y usa la IA para analizarlos. El dashboard mostrará tus estadísticas cuando empieces a procesar documentos.',
        icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        targetId: 'tour-gepdia-dashboard',
        bubblePos: 'bottom',
      },
      {
        title: 'Mis Documentos',
        description: 'Carga aquí tus contratos, poderes, expedientes y demás documentos legales. Organízalos en carpetas y la IA podrá analizarlos.',
        icon: 'M9 12h6m-6 4h6M5 8h14M5 4h14',
        targetId: 'tour-gepdia-misdocs',
        bubblePos: 'right',
      },
      {
        title: 'Consulta IA',
        description: 'Aquí haces preguntas sobre tus documentos. Escribe en lenguaje natural: "¿Cuándo vence el contrato?" y la IA te responde al instante.',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        targetId: 'tour-gepdia-ia',
        bubblePos: 'right',
      },
      {
        title: 'Generación de Documentos',
        description: 'Genera contratos, poderes, actas y más a partir de plantillas. Carga tus propias plantillas en Gestión de Plantillas.',
        icon: 'M9 12h6m-6 4h6M5 8h14M5 4h14',
        targetId: 'tour-gepdia-gendoc',
        bubblePos: 'right',
      },
    ],
    spj: [
      {
        title: 'SPJ – Procesos Judiciales',
        description: 'Aquí gestionas todos tus expedientes judiciales. El dashboard mostrará métricas cuando registres tus primeros casos.',
        icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
        targetId: 'tour-spj-dashboard',
        bubblePos: 'bottom',
      },
      {
        title: 'Casos Judiciales',
        description: 'Crea y gestiona tus expedientes judiciales. Asigna cliente, entidad, tipo de caso, etapas procesales y documentos adjuntos.',
        icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
        targetId: 'tour-spj-casos',
        bubblePos: 'right',
      },
    ],
  };

  readonly rutasOrden      = ['portal', 'configuracion', 'gap', 'gepdia', 'spj'];
  private rutasOrdenActual = this.rutasOrden;
  readonly rutaNavegacion: Record<string, string> = {
    portal: '/portal', configuracion: '/configuracion',
    gap: '/gap', gepdia: '/gepdia', spj: '/spj',
  };

  get pasosRutaActual(): TourStep[]  { return this.pasosPorRuta[this.rutaActual()] ?? []; }
  get pasoInfo(): TourStep | null    { return this.pasosRutaActual[this.pasoActual()] ?? null; }

  /** True si la ruta tiene pasos de tour definidos */
  tienePasosParaRuta(ruta: string): boolean {
    return (this.pasosPorRuta[ruta]?.length ?? 0) > 0;
  }

  /** Último paso de la ruta dada (para mostrar "¡Listo!" en tour parcial) */
  esUltimoPasoRuta(ruta: string): boolean {
    const pasos = this.pasosPorRuta[ruta] ?? [];
    return this.pasoActual() === pasos.length - 1;
  }

  get esUltimoPaso(): boolean {
    const rIdx = this.rutasOrden.indexOf(this.rutaActual());
    return rIdx === this.rutasOrden.length - 1 && this.pasoActual() === this.pasosRutaActual.length - 1;
  }

  get numeroTotalPasos(): number {
    return this.rutasOrden.reduce((s, r) => s + (this.pasosPorRuta[r]?.length ?? 0), 0);
  }

  get numeroPasoGlobal(): number {
    const rIdx = this.rutasOrden.indexOf(this.rutaActual());
    let total = 0;
    for (let i = 0; i < rIdx; i++) total += this.pasosPorRuta[this.rutasOrden[i]]?.length ?? 0;
    return total + this.pasoActual() + 1;
  }

  /** Tour completo de primer inicio — navega por todas las rutas */
  iniciarTour(desdeRuta?: string): void {
    this._modoCompleto = true;
    if (desdeRuta && desdeRuta !== 'portal') {
      this.rutasOrdenActual = this.rutasOrden.slice(this.rutasOrden.indexOf(desdeRuta));
    } else {
      this.rutasOrdenActual = this.rutasOrden;
    }
    setTimeout(() => {
      this.rutaActual.set(desdeRuta || 'portal');
      this.pasoActual.set(0);
      this.tourActivo.set(true);
    }, 400);
  }

  /** Tour parcial — solo la ruta actual (botón ?) */
  iniciarTourRuta(ruta: string): void {
    const pasos = this.pasosPorRuta[ruta];
    if (!pasos?.length) return;
    this._modoCompleto = false;
    this._soloUnPasoParaRuta = (ruta === 'gepdia');
    this.rutaActual.set(ruta);
    this.pasoActual.set(0);
    this.tourActivo.set(true);
  }

  /** Llamado por cada componente al montarse para sincronizar la ruta activa */
  registrarRuta(ruta: string): void {
    if (this.tourActivo() && this.rutaActual() !== ruta) {
      // si el router nos llevó aquí durante el tour, actualizar
      this.rutaActual.set(ruta);
      this.pasoActual.set(0);
    }
  }

  siguiente(): void {
    const pasos = this.pasosRutaActual;
    // Si es tour parcial de GEPDIA (solo dashboard), cierra en lugar de continuar
    if (!this._modoCompleto && this._soloUnPasoParaRuta) {
      this.completarTour();
      return;
    }
    if (this.pasoActual() < pasos.length - 1) {
      this.pasoActual.update(p => p + 1);
    } else {
      // Último paso de esta ruta — si es tour completo (primer inicio) navega; si es tour parcial, cierra
      if (this._modoCompleto) {
        const rIdx = this.rutasOrdenActual.indexOf(this.rutaActual());
        if (rIdx < this.rutasOrdenActual.length - 1) {
          const next = this.rutasOrdenActual[rIdx + 1];
          this.rutaActual.set(next);
          this.pasoActual.set(0);
          this.router.navigate([this.rutaNavegacion[next]]);
        } else {
          this.completarTour();
        }
      } else {
        this.completarTour();
      }
    }
  }

  omitir(): void { this.completarTour(); }

  private completarTour(): void {
    this.tourActivo.set(false);
    if (this._modoCompleto && this.rutaActual() === 'configuracion') {
      this._modoCompleto = false;
      this.auth.marcarTourCompletado();
      sessionStorage.setItem('mostrar-continuar-tutorial', 'true');
      this.router.navigate(['/tu-plan']);
    } else {
      this._modoCompleto = false;
      this.auth.marcarTourCompletado();
    }
  }
}
