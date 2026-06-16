import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface Usuario {
  id?: string;
  email: string;
  password?: string;
  nombre?: string;
  roles?: Rol[];
}

export interface Rol {
  id?: string;
  rol: string;
  notaria?: string;
  app?: string;
}

export interface CoberturaInfo {
  id: string;
  usuarioCubiertoNombre: string;
  motivo: string;
  fechaFin: string;
}

export interface AuthData {
  usuario: Usuario;
  rolActivo: Rol;
  token?: string;
  coberturaActiva?: CoberturaInfo;
}

const ADMIN_EMAIL = 'admin@sigcomt.com';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authData = signal<AuthData | null>(null);
  private cargando = signal(false);
  private error = signal<string | null>(null);

  // Pending state between login steps and cobertura selection
  private _pendingUsuario: any = null;
  private _pendingRol: Rol | null = null;

  estaAutenticado = computed(() => this.authData() !== null);
  esAdmin = computed(() => {
    const auth = this.authData();
    if (!auth) return false;
    const email = auth.usuario.email ?? '';
    if (email.endsWith('@sigcomt.com')) return true;
    return auth.rolActivo?.rol === 'Administrador Sigcomt';
  });

  puedeAccederConfiguracion = computed(() => {
    const auth = this.authData();
    if (!auth) return false;
    const rol = auth.rolActivo?.rol ?? '';
    return rol === 'Administrador Sigcomt' || rol === 'Administrador' || rol === 'Independiente';
  });

  esIndependiente = computed(() => this.authData()?.rolActivo?.rol === 'Independiente');
  esDigitador     = computed(() => this.authData()?.rolActivo?.rol === 'Digitador');

  esPrimeraVez = computed(() => {
    const auth = this.authData();
    if (!auth) return false;
    const key = `sigcomt_tour_done_${(auth.usuario as any).id ?? auth.usuario.email}`;
    return !localStorage.getItem(key);
  });

  obtenerSuscripcion(): any {
    const auth = this.authData();
    if (!auth) return null;
    const usuarios: any[] = JSON.parse(localStorage.getItem('sigcomt_usuarios') || '[]');
    const user = usuarios.find(u => u.email === auth.usuario.email);
    return user?.suscripcion ?? null;
  }

  marcarTourCompletado(): void {
    const auth = this.authData();
    if (!auth) return;
    const key = `sigcomt_tour_done_${(auth.usuario as any).id ?? auth.usuario.email}`;
    localStorage.setItem(key, '1');
  }

  coberturaActiva = computed(() => this.authData()?.coberturaActiva ?? null);

  constructor(private router: Router) {
    this.seedAdminUser();
    this.cargarDelStorage();
  }

  private seedAdminUser() {
    try {
      const usuarios: any[] = JSON.parse(localStorage.getItem('sigcomt_usuarios') || '[]');

      const adminIdx = usuarios.findIndex((u: any) => u.email === ADMIN_EMAIL);
      if (adminIdx !== -1) {
        if (usuarios[adminIdx].nombres !== 'Administrador') {
          usuarios[adminIdx].nombres = 'Administrador';
          usuarios[adminIdx].apellidos = '';
        }
        if (usuarios[adminIdx].roles?.[0]?.rol === 'Administrador') {
          usuarios[adminIdx].roles[0].rol = 'Administrador Sigcomt';
        }
      } else {
        usuarios.unshift({
          id: 'U000', username: 'admin', nombres: 'Administrador', apellidos: '',
          email: ADMIN_EMAIL, celular: '', pwd: btoa('admin1234'), notaria: 'Todas',
          roles: [{ notaria: 'Todas', rol: 'Administrador Sigcomt', app: 'TODOS' }],
          estado: 'Activo', avatar: '', condicion: '', comision: '',
          tipoUsuario: 'Administrador', abogadoAsociado: ''
        });
      }

      const avegaIdx = usuarios.findIndex((u: any) => u.email === 'avega@gepdia.pe');
      if (avegaIdx !== -1) usuarios.splice(avegaIdx, 1);

      const adminLegacyIdx = usuarios.findIndex((u: any) => u.email === 'admin' || (!u.email?.includes('@') && u.username === 'admin' && u.email !== ADMIN_EMAIL));
      if (adminLegacyIdx !== -1) usuarios.splice(adminLegacyIdx, 1);

      if (!usuarios.find((u: any) => u.email === 'sechavarria@notarialima.pe')) {
        usuarios.push({
          id: 'U005', username: 'sechavarria', nombres: 'Sandra', apellidos: 'Echavarria',
          email: 'sechavarria@notarialima.pe', celular: '991234567', pwd: btoa('sandra123'),
          notaria: 'Notaría Lima Centro',
          roles: [
            { id: 'R-U005-1', notaria: 'Notaría Lima Centro', rol: 'Administrador', app: 'TODOS' },
            { id: 'R-U005-2', notaria: 'Notaría Lima Centro', rol: 'Digitador',     app: 'SPJ,GAP' }
          ],
          estado: 'Activo', avatar: '', condicion: '', comision: '',
          tipoUsuario: 'Administrador', abogadoAsociado: ''
        });
      } else {
        // Garantiza que Sandra siempre tenga los 2 roles (por si ya existía con 1)
        const sandra = usuarios.find((u: any) => u.email === 'sechavarria@notarialima.pe');
        if (sandra && (!sandra.roles || sandra.roles.length < 2)) {
          sandra.roles = [
            { id: 'R-U005-1', notaria: 'Notaría Lima Centro', rol: 'Administrador', app: 'TODOS' },
            { id: 'R-U005-2', notaria: 'Notaría Lima Centro', rol: 'Digitador',     app: 'SPJ,GAP' }
          ];
        }
      }

      if (!usuarios.find((u: any) => u.email === 'bjimenez@notarialima.pe')) {
        usuarios.push({
          id: 'U006', username: 'bjimenez', nombres: 'Bandy', apellidos: 'Jimenez',
          email: 'bjimenez@notarialima.pe', celular: '992345678', pwd: btoa('bandy123'),
          notaria: 'Notaría Lima Centro',
          roles: [{ notaria: 'Notaría Lima Centro', rol: 'Abogado Senior', app: 'SCG,SPJ,GAP' }],
          estado: 'Activo', avatar: '', condicion: 'Interno', comision: '',
          tipoUsuario: 'Abogado', abogadoAsociado: ''
        });
      }

      if (!usuarios.find((u: any) => u.email === 'acorrales@independiente.pe')) {
        usuarios.push({
          id: 'U007', username: 'acorrales', nombres: 'Alberto', apellidos: 'Corrales Vega',
          email: 'acorrales@independiente.pe', celular: '987654321', pwd: btoa('alberto123'),
          notaria: 'Estudio Corrales & Asociados',
          roles: [{ notaria: 'Estudio Corrales & Asociados', rol: 'Independiente', app: 'TODOS' }],
          estado: 'Activo', avatar: '', condicion: 'Independiente', comision: '',
          tipoUsuario: 'Independiente', abogadoAsociado: '',
          suscripcion: { plan: 'Abogado Independiente', precio: '49.90', moneda: 'S/', periodo: 'mes',
            cobradoEn: 'Soles (PEN)', vencimiento: '28 de julio de 2026', estado: 'Activo', prueba: false,
            visa: { numero: '4321', expira: '11/2027' },
            facturacion: { nombre: 'Alberto Corrales Vega', direccion: 'Av. El Derby 254, Santiago de Surco, Lima 15036, PE' },
            facturas: [
              { fecha: '28 may 2026', monto: '49.90', moneda: 'S/', estado: 'Pagada', descripcion: 'Plan Abogado Independiente – Mayo 2026' },
              { fecha: '28 abr 2026', monto: '49.90', moneda: 'S/', estado: 'Pagada', descripcion: 'Plan Abogado Independiente – Abril 2026' },
              { fecha: '28 mar 2026', monto: '49.90', moneda: 'S/', estado: 'Pagada', descripcion: 'Plan Abogado Independiente – Marzo 2026' },
            ]
          }
        });
      }

      localStorage.setItem('sigcomt_usuarios', JSON.stringify(usuarios));
    } catch (e) {
      console.error('Error seeding users:', e);
    }
  }

  private cargarDelStorage() {
    try {
      const saved = sessionStorage.getItem('sigcomt_auth');
      if (saved) {
        this.authData.set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error cargando auth del storage:', e);
    }
  }

  login(email: string, password: string): Promise<{ exito: boolean; rolRequired?: boolean; roles?: Rol[] }> {
    this.cargando.set(true);
    this.error.set(null);

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const usuarios: any[] = JSON.parse(localStorage.getItem('sigcomt_usuarios') || '[]');
          const pwdHash = btoa(password);
          const usuario = usuarios.find(u =>
            u.email === email &&
            (u.pwd === pwdHash || u.password === password) &&
            u.roles && u.roles.length > 0
          );

          if (!usuario) {
            this.error.set('Correo o contraseña incorrectos.');
            this.cargando.set(false);
            resolve({ exito: false });
            return;
          }

          // Store full user for finalizarLogin
          this._pendingUsuario = usuario;

          if (usuario.roles!.length > 1) {
            this.cargando.set(false);
            resolve({ exito: true, rolRequired: true, roles: usuario.roles });
            return;
          }

          // Single role: store it, let login component finalize after cobertura check
          this._pendingRol = usuario.roles![0];
          this.cargando.set(false);
          resolve({ exito: true, rolRequired: false });
        } catch (e) {
          this.error.set('Error en el login');
          this.cargando.set(false);
          resolve({ exito: false });
        }
      }, 900);
    });
  }

  setPendingRol(rol: Rol): void {
    this._pendingRol = rol;
  }

  /** Called by login component after cobertura selection */
  finalizarLogin(cobertura?: CoberturaInfo): void {
    if (this._pendingUsuario && this._pendingRol) {
      this.completarLogin(this._pendingUsuario, this._pendingRol, cobertura);
      this._pendingUsuario = null;
      this._pendingRol = null;
    }
  }

  /** Kept for backward compatibility */
  seleccionarRol(usuario: Usuario, rol: Rol): void {
    const fullUser = this._pendingUsuario ?? usuario;
    this._pendingRol = rol;
    this.completarLogin(fullUser, rol);
    this._pendingUsuario = null;
    this._pendingRol = null;
  }

  private completarLogin(usuario: any, rol: Rol, cobertura?: CoberturaInfo): void {
    const { pwd: _pwd, password: _password, ...usuarioSinPassword } = usuario;
    const authData: AuthData = {
      usuario: usuarioSinPassword,
      rolActivo: rol,
      token: this.generarToken(),
      coberturaActiva: cobertura
    };

    this.authData.set(authData);
    sessionStorage.setItem('sigcomt_auth', JSON.stringify(authData));
    sessionStorage.setItem('auth', 'true');

    this.cargando.set(false);
    this.router.navigate(['/portal']);
  }

  private generarToken(): string {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  logout(): void {
    this.authData.set(null);
    sessionStorage.removeItem('sigcomt_auth');
    sessionStorage.removeItem('auth');
    this.router.navigate(['/login']);
  }

  obtenerNombreDisplay = computed(() => {
    const u = this.authData()?.usuario as any;
    if (!u) return 'Usuario';
    return u.nombres || u.nombre || u.email || 'Usuario';
  });

  obtenerAuth(): AuthData | null {
    return this.authData();
  }

  obtenerCargando() {
    return this.cargando.asReadonly();
  }

  obtenerError() {
    return this.error.asReadonly();
  }

  recordarEmail(email: string): void {
    localStorage.setItem('sigcomt_remember_email', email);
  }

  olvidarEmail(): void {
    localStorage.removeItem('sigcomt_remember_email');
  }

  obtenerEmailRecordado(): string | null {
    return localStorage.getItem('sigcomt_remember_email');
  }
}
