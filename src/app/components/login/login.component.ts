import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, CoberturaInfo, Rol, Usuario } from '../../services/auth.service';

interface CoberturaOpcion {
  id: string;
  usuarioCubiertoNombre: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private sliderInterval: ReturnType<typeof setInterval> | null = null;

  titulo = signal('Suite de Procesos Judiciales');
  subtitulo = signal('Plataforma integral para la gestión de procesos judiciales');
  banners = signal([
    'assets/img/Banner3_1.png',
    'assets/img/Banner3_2.png',
    'assets/img/Banner3_3.png'
  ]);

  correo = signal('');
  password = signal('');
  recordar = signal(false);
  passVisible = signal(false);

  mostrarLogo = signal(true);
  mostrarLogoMobile = signal(true);
  mostrarLogoRol = signal(true);

  pantallaActual = signal<'login' | 'roles' | 'cobertura'>('login');
  usuarioAutenticado = signal<Usuario | null>(null);
  rolesDisponibles = signal<Rol[]>([]);
  rolSeleccionado = signal<Rol | null>(null);
  sliderIndex = signal(0);

  // Cobertura temporal
  coberturasDisponibles = signal<CoberturaOpcion[]>([]);
  coberturaElegidaId = signal<string | null>(null); // null = ingresar como yo mismo
  nombreUsuarioLogueado = signal('');

  cargando = computed(() => this.authService.obtenerCargando()());
  mostrarError = computed(() => this.authService.obtenerError()() !== null);
  errorMsg = computed(() => this.authService.obtenerError()());
  bannerActivo = computed(() => this.banners()[this.sliderIndex()]);

  ngOnInit() {
    const auth = this.authService.obtenerAuth();
    if (auth) {
      this.router.navigate(['/portal']);
      return;
    }
    this.cargarConfig();
    this.cargarRecordado();
    this.iniciarSlider();
  }

  ngOnDestroy() {
    if (this.sliderInterval !== null) clearInterval(this.sliderInterval);
  }

  cargarConfig() {
    const cfg = JSON.parse(localStorage.getItem('sigcomt_login_cfg') || '{}');
    if (cfg.titulo) this.titulo.set(cfg.titulo);
    if (cfg.subtitulo) this.subtitulo.set(cfg.subtitulo);
    if (cfg.banners) this.banners.set(cfg.banners);
  }

  cargarRecordado() {
    const savedEmail = this.authService.obtenerEmailRecordado();
    if (savedEmail) {
      this.correo.set(savedEmail);
      this.recordar.set(true);
    }
  }

  togglePass() { this.passVisible.update(v => !v); }

  async handleLogin() {
    const email = this.correo().trim();
    const pwd = this.password();
    if (!email || !pwd) return;

    const resultado = await this.authService.login(email, pwd);

    if (resultado.exito) {
      if (this.recordar()) {
        this.authService.recordarEmail(email);
      } else {
        this.authService.olvidarEmail();
      }

      if (resultado.rolRequired && resultado.roles) {
        this.usuarioAutenticado.set({ email, roles: resultado.roles });
        this.rolesDisponibles.set(resultado.roles);
        this.pantallaActual.set('roles');
      } else {
        // Single role: check coberturas before finalizing
        this.verificarYMostrarCobertura(email);
      }
    }
  }

  seleccionarRolPorId(id: string) {
    const rol = this.rolesDisponibles().find(r => r.id === id) ?? null;
    this.rolSeleccionado.set(rol);
  }

  confirmarRol() {
    const rol = this.rolSeleccionado();
    const usuario = this.usuarioAutenticado();
    if (!rol || !usuario) return;
    this.authService.setPendingRol(rol);
    this.verificarYMostrarCobertura(usuario.email);
  }

  volverLogin() {
    this.pantallaActual.set('login');
    this.rolSeleccionado.set(null);
    this.usuarioAutenticado.set(null);
  }

  private verificarYMostrarCobertura(email: string) {
    const coberturas = this.obtenerCoberturaActivas(email);
    if (coberturas.length > 0) {
      const usuarios: any[] = JSON.parse(localStorage.getItem('sigcomt_usuarios') || '[]');
      const u = usuarios.find(x => x.email === email);
      this.nombreUsuarioLogueado.set(u ? (u.nombres + ' ' + u.apellidos).trim() : email);
      this.coberturasDisponibles.set(coberturas);
      this.coberturaElegidaId.set(null); // default: yo mismo
      this.pantallaActual.set('cobertura');
    } else {
      this.authService.finalizarLogin();
    }
  }

  private obtenerCoberturaActivas(email: string): CoberturaOpcion[] {
    const usuarios: any[] = JSON.parse(localStorage.getItem('sigcomt_usuarios') || '[]');
    const u = usuarios.find(x => x.email === email);
    if (!u) return [];
    const coberturas: any[] = JSON.parse(localStorage.getItem('sigcomt_coberturas_temp') || '[]');
    const hoy = new Date().toISOString().split('T')[0];
    return coberturas.filter(c =>
      c.usuarioId === u.id && c.fechaInicio <= hoy && c.fechaFin >= hoy
    );
  }

  seleccionarModo(coberturaId: string | null) {
    this.coberturaElegidaId.set(coberturaId);
  }

  confirmarCobertura() {
    const id = this.coberturaElegidaId();
    if (id === null) {
      // Ingresa como sí mismo
      this.authService.finalizarLogin();
    } else {
      const c = this.coberturasDisponibles().find(x => x.id === id);
      if (!c) return;
      const info: CoberturaInfo = {
        id: c.id,
        usuarioCubiertoNombre: c.usuarioCubiertoNombre,
        motivo: c.motivo,
        fechaFin: c.fechaFin
      };
      this.authService.finalizarLogin(info);
    }
  }

  iniciarSlider() {
    this.sliderInterval = setInterval(() => {
      this.sliderIndex.update(idx => (idx + 1) % this.banners().length);
    }, 5000);
  }
}
