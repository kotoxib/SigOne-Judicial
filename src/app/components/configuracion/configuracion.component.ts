import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject, WritableSignal, ViewEncapsulation, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ProductTourService } from '../../services/product-tour.service';
import { ProductTourComponent } from '../product-tour/product-tour.component';
import { UsuarioModalComponent } from './modals/usuario/usuario-modal.component';
import { RestablecerPwdModalComponent } from './modals/restablecer-pwd/restablecer-pwd-modal.component';
import { CoberturaTempModalComponent } from './modals/cobertura-temp/cobertura-temp-modal.component';
import { RolModalComponent } from './modals/rol/rol-modal.component';

// ── Interfaces ───────────────────────────────────────────────────────────────
interface RolAsignado { notaria: string; rol: string; app: string; }
interface Rol { id: string; nombre: string; descripcion: string; tipoUsuario: string; notaria: string; app: string; estado: string; }
interface Usuario { id: string; username: string; nombres: string; apellidos: string; email: string; celular: string; pwd: string; notaria: string; roles: RolAsignado[]; estado: string; avatar: string; condicion: string; comision: string; tipoUsuario: string; abogadoAsociado: string; abogadosAsistidos: string[]; }
interface CoberturaTemp { id: string; usuarioId: string; usuarioCubiertoId: string; usuarioCubiertoNombre: string; motivo: string; fechaInicio: string; fechaFin: string; }
interface Notaria { id: string; razon: string; notario: string; ruc: string; distrito: string; telefono: string; email: string; direccion: string; apps: string[]; estado: string; gepdia_consultas: number; gepdia_consultas_usadas: number; gepdia_cargas: number; gepdia_cargas_usadas: number; }
interface TipoGasto { id: string; codigo: string; nombre: string; descripcion: string; aplicativo: string; tipo: string; estado: string; }
interface TipoArancel { id: string; codigo: string; tipoGasto: string; nombre: string; concepto: string; costo: number; estado: string; }
interface TipoDocumento { id: string; codigo: string; nombre: string; descripcion: string; estado: string; }
interface Contacto { nombre: string; cargo: string; correo: string; telefono: string; principal: boolean; }
interface Cliente { id: string; nombre: string; tipoDoc: string; nroDoc: string; entidad: string; correo: string; estado: string; contactos: Contacto[]; }
interface Aplicativo { id: string; notaria: string; nombre: string; descripcion: string; url: string; icono: string; estado: string; }
interface Titulo { [key: string]: string; }
interface TablaGen { id: string; codigo: string; nombre: string; tipo: string; descripcion: string; estado: string; }
interface EtapaItem { id: string; nombre: string; tiposProceso: string[]; tipoEtapa: string; }
interface DuracionItem { etapaId: string; tipoProceso: string; diasCaso: number; diasAlerta: number; diasMeta: number; diasDEJ: number; }
interface ConfigEtapa { id: string; entidad: string; banco: string; clientes: string[]; aplicativo: string; etapas: EtapaItem[]; duraciones: DuracionItem[]; descripcion: string; estado: string; }
interface SubEstadoItem { id: string; nombre: string; descripcion: string; estado: string; }
interface ConfigSubEtapa { id: string; entidad: string; clientes: string[]; etapaId: string; etapaNombre: string; subestados: SubEstadoItem[]; estado: string; }
interface TipoCaso { id: string; codigo: string; nombre: string; entidad: string; moneda: string; montoBase: number; estado: string; }

// ── Default data ─────────────────────────────────────────────────────────────
const DEF_ROLES: Rol[] = [
  { id:'R001', nombre:'Administrador Sigcomt',  descripcion:'Acceso total al sistema (solo dominio @sigcomt.com)', tipoUsuario:'Administrador', notaria:'Todas', app:'TODOS', estado:'Activo' },
  { id:'R002', nombre:'Abogado Senior',        descripcion:'Gestión avanzada de procesos y expedientes',  tipoUsuario:'Abogado',       notaria:'Notaría Lima Centro', app:'SPJ',   estado:'Activo' },
  { id:'R003', nombre:'Abogado Interno',       descripcion:'Gestión de procesos internos',                tipoUsuario:'Abogado',       notaria:'Notaría Lima Centro', app:'SPJ',   estado:'Activo' },
  { id:'R004', nombre:'Abogado Externo',       descripcion:'Gestión de procesos externos con comisión',   tipoUsuario:'Abogado',       notaria:'Notaría Miraflores',  app:'SPJ',   estado:'Activo' },
  { id:'R005', nombre:'Asistente',             descripcion:'Consulta y apoyo administrativo',             tipoUsuario:'Asistente',     notaria:'Notaría San Isidro',  app:'GAP',   estado:'Activo' },
  { id:'R006', nombre:'Digitador',             descripcion:'Registro y carga de información',             tipoUsuario:'Digitador',     notaria:'Todas',              app:'SPJ',   estado:'Activo' },
  { id:'R007', nombre:'Mantenedor',            descripcion:'Gestión de roles, usuarios y catálogos',      tipoUsuario:'Mantenedor',    notaria:'Todas',              app:'TODOS', estado:'Activo' },
  { id:'R008', nombre:'Gestor de Gastos',      descripcion:'Registro, aprobación y pago de gastos en GAP',tipoUsuario:'Asistente',    notaria:'Todas',              app:'GAP',   estado:'Activo' },
  { id:'R009', nombre:'Gestor de Liquidaciones',descripcion:'Generación y cierre de liquidaciones en GAP',tipoUsuario:'Asistente',   notaria:'Todas',              app:'GAP',   estado:'Activo' },
  { id:'R010', nombre:'Independiente',         descripcion:'Abogado independiente con suscripción propia — acceso a todos los aplicativos', tipoUsuario:'Abogado', notaria:'Independiente', app:'TODOS', estado:'Activo' },
];

const DEF_NOTARIAS: Notaria[] = [
  { id:'N001', razon:'Notaría Lima Centro',  notario:'Dr. Roberto Sánchez', ruc:'20501234567', distrito:'Lima',            telefono:'01-4261234', email:'contacto@notlimac.com',    direccion:'Jr. Cusco 230, Lima',               apps:['SCG','SPJ','GAP','GEPDIA'], estado:'Activo',   gepdia_consultas:100, gepdia_consultas_usadas:23, gepdia_cargas:300, gepdia_cargas_usadas:45 },
  { id:'N002', razon:'Notaría Miraflores',   notario:'Dra. Carmen López',   ruc:'20501234568', distrito:'Miraflores',      telefono:'01-2413322', email:'info@notmiraflores.com',   direccion:'Av. Larco 115, Miraflores',          apps:['SPJ','GEPDIA'],            estado:'Activo',   gepdia_consultas:60,  gepdia_consultas_usadas:8,  gepdia_cargas:150, gepdia_cargas_usadas:12 },
  { id:'N003', razon:'Notaría San Isidro',   notario:'Dr. Miguel Torres',   ruc:'20501234569', distrito:'San Isidro',      telefono:'01-2229800', email:'info@notsi.com',           direccion:'Av. Rivera Navarrete 600',           apps:['GAP'],                     estado:'Activo',   gepdia_consultas:0,   gepdia_consultas_usadas:0,  gepdia_cargas:0,   gepdia_cargas_usadas:0  },
  { id:'N004', razon:'Notaría Surco',        notario:'Dra. Ana Mejía',      ruc:'20501234570', distrito:'Santiago de Surco',telefono:'01-3458900', email:'notaria@surco.com',       direccion:'Av. Caminos del Inca 221',           apps:['SCG'],                     estado:'Inactivo', gepdia_consultas:0,   gepdia_consultas_usadas:0,  gepdia_cargas:0,   gepdia_cargas_usadas:0  },
];

const DEF_USUARIOS: Usuario[] = [
  { id:'U001', username:'cbarrios',    nombres:'César',   apellidos:'Barrios',        email:'cbarrios@sigcomt.com',          celular:'999888777', pwd:'', notaria:'Todas',               roles:[{notaria:'Todas',rol:'Administrador Sigcomt',app:'TODOS'}],                                     estado:'Activo',   avatar:'', condicion:'',       comision:'',  tipoUsuario:'Administrador', abogadoAsociado:'', abogadosAsistidos:[] },
  { id:'U007', username:'acorrales',   nombres:'Alberto', apellidos:'Corrales Vega',  email:'acorrales@independiente.pe',    celular:'987654321', pwd:'', notaria:'Estudio Corrales & Asociados', roles:[{notaria:'Estudio Corrales & Asociados',rol:'Independiente',app:'TODOS'}],        estado:'Activo',   avatar:'', condicion:'Independiente', comision:'', tipoUsuario:'Independiente', abogadoAsociado:'', abogadosAsistidos:[] },
  { id:'U003', username:'mquispe',     nombres:'María',   apellidos:'Quispe Torres',  email:'mquispe@gepdia.pe',             celular:'997321654', pwd:'', notaria:'Notaría Miraflores',  roles:[{notaria:'Notaría Miraflores',rol:'Abogado Externo',app:'SPJ'}],                               estado:'Activo',   avatar:'', condicion:'Externo',comision:'15',tipoUsuario:'Abogado',       abogadoAsociado:'', abogadosAsistidos:[] },
  { id:'U004', username:'lflores',     nombres:'Luis',    apellidos:'Flores Mendoza', email:'lflores@gepdia.pe',             celular:'996789012', pwd:'', notaria:'Notaría San Isidro',  roles:[{notaria:'Notaría San Isidro',rol:'Asistente',app:'GAP'}],                                     estado:'Inactivo', avatar:'', condicion:'',       comision:'',  tipoUsuario:'Asistente',     abogadoAsociado:'', abogadosAsistidos:[] },
  { id:'U005', username:'sechavarria', nombres:'Sandra',  apellidos:'Echavarria',     email:'sechavarria@notarialima.pe',    celular:'991234567', pwd:'', notaria:'Notaría Lima Centro', roles:[{notaria:'Notaría Lima Centro',rol:'Administrador',app:'TODOS'}],                               estado:'Activo',   avatar:'', condicion:'',       comision:'',  tipoUsuario:'Administrador', abogadoAsociado:'', abogadosAsistidos:[] },
  { id:'U006', username:'bjimenez',    nombres:'Bandy',   apellidos:'Jimenez',        email:'bjimenez@notarialima.pe',       celular:'992345678', pwd:'', notaria:'Notaría Lima Centro', roles:[{notaria:'Notaría Lima Centro',rol:'Abogado Senior',app:'SCG,SPJ,GAP'}],                        estado:'Activo',   avatar:'', condicion:'Interno',comision:'',  tipoUsuario:'Abogado',       abogadoAsociado:'', abogadosAsistidos:[] },
];

const DEF_CLIENTES: Cliente[] = [
  { id:'CL001', nombre:'María García López',            tipoDoc:'DNI', nroDoc:'47834512',    entidad:'Persona Natural', correo:'maria.garcia@mail.com', estado:'Activo',   contactos:[] },
  { id:'CL002', nombre:'Carlos Mendoza Ríos',           tipoDoc:'DNI', nroDoc:'31456789',    entidad:'Persona Natural', correo:'c.mendoza@gmail.com',   estado:'Activo',   contactos:[] },
  { id:'CL003', nombre:'Construcciones Andinas S.A.C.', tipoDoc:'RUC', nroDoc:'20601234567', entidad:'Empresa',         correo:'',                      estado:'Activo',   contactos:[
    {nombre:'Roberto Puma',    cargo:'Gerente General', correo:'r.puma@candinas.pe',   telefono:'998765432', principal:true},
    {nombre:'Ana Torres',      cargo:'Jefa Legal',      correo:'a.torres@candinas.pe', telefono:'987654321', principal:false},
  ]},
  { id:'CL004', nombre:'BCP – Banco de Crédito',        tipoDoc:'RUC', nroDoc:'20100047218', entidad:'Banco',           correo:'',                      estado:'Activo',   contactos:[
    {nombre:'Patricia Llanos', cargo:'Gerente Legal',   correo:'p.llanos@viabcp.com',  telefono:'01-3131300', principal:true},
  ]},
  { id:'CL005', nombre:'BBVA Perú',                     tipoDoc:'RUC', nroDoc:'20492092313', entidad:'Banco',           correo:'',                      estado:'Activo',   contactos:[
    {nombre:'Sandra Reyes',    cargo:'Coordinadora Legal',correo:'s.reyes@bbva.com',   telefono:'01-2112000', principal:true},
  ]},
];

const DEF_APLICATIVOS: Aplicativo[] = [
  { id:'AP001', notaria:'Notaría Lima Centro', nombre:'SCG – Cobranzas',  descripcion:'Control de aranceles y demandas bancarias', url:'cobranzas.html', icono:'', estado:'Activo'   },
  { id:'AP002', notaria:'Notaría Lima Centro', nombre:'SPJ – Procesos',   descripcion:'Gestión de expedientes y etapas procesales', url:'procesos.html',  icono:'', estado:'Activo'   },
  { id:'AP003', notaria:'Notaría Miraflores',  nombre:'SPJ – Procesos',   descripcion:'Gestión de expedientes y etapas procesales', url:'procesos.html',  icono:'', estado:'Activo'   },
  { id:'AP004', notaria:'Notaría San Isidro',  nombre:'GAP – Gastos',     descripcion:'Gastos y liquidaciones por proceso',          url:'gastos.html',    icono:'', estado:'Activo'   },
  { id:'AP005', notaria:'Notaría Surco',       nombre:'SCG – Cobranzas',  descripcion:'Control de aranceles',                       url:'cobranzas.html', icono:'', estado:'Inactivo' },
];

const DEF_TABLAS: TablaGen[] = [
  { id:'TG001', codigo:'TG001', nombre:'Entidades',               tipo:'entidad',        descripcion:'Tipos de entidad del sistema',                estado:'Activo' },
  { id:'TG002', codigo:'TG002', nombre:'Etapas Procesales',       tipo:'etapa',          descripcion:'Etapas del proceso judicial',                  estado:'Activo' },
  { id:'TG003', codigo:'TG003', nombre:'Tipos de Documento',      tipo:'documento',      descripcion:'Documentos de identificación aceptados',       estado:'Activo' },
  { id:'TG004', codigo:'TG004', nombre:'Tipos de Caso',           tipo:'caso',           descripcion:'Categorías de casos legales',                  estado:'Activo' },
  { id:'TG005', codigo:'TG005', nombre:'Monedas',                 tipo:'moneda',         descripcion:'Monedas aceptadas en el sistema',              estado:'Activo' },
  { id:'TG006', codigo:'TG006', nombre:'Tipos de Gasto',          tipo:'gasto',          descripcion:'Categorías de gastos procesales',              estado:'Activo' },
  { id:'TG007', codigo:'TG007', nombre:'Tipos de Arancel',        tipo:'arancel',        descripcion:'Clasificación de aranceles judiciales',        estado:'Activo' },
  { id:'TG008', codigo:'TG008', nombre:'No Impulso',              tipo:'dato-adicional', descripcion:'Proceso sin impulso por parte del banco',      estado:'Activo' },
  { id:'TG009', codigo:'TG009', nombre:'Posterior a PA',          tipo:'dato-adicional', descripcion:'Dato registrado posterior a Actos Preparatorios', estado:'Activo' },
  { id:'TG010', codigo:'TG010', nombre:'Estado Alerta Registral', tipo:'dato-adicional', descripcion:'Alerta registrada en el sistema registral',    estado:'Activo' },
  { id:'TG011', codigo:'TG011', nombre:'N de Alerta',             tipo:'dato-adicional', descripcion:'Número de alerta registral asociada al caso',  estado:'Activo' },
  { id:'TG012', codigo:'TG012', nombre:'Garantía - Embargo',      tipo:'dato-adicional', descripcion:'Bien dado en garantía o con medida de embargo',estado:'Activo' },
  { id:'TG013', codigo:'TG013', nombre:'Inmueble',                tipo:'dato-adicional', descripcion:'Descripción del bien inmueble vinculado',      estado:'Activo' },
  { id:'TG014', codigo:'TG014', nombre:'Vehículo',                tipo:'dato-adicional', descripcion:'Descripción del vehículo vinculado al caso',   estado:'Activo' },
  { id:'TG015', codigo:'TG015', nombre:'Cuenta Corriente',        tipo:'dato-adicional', descripcion:'Cuenta corriente embargada o afectada',        estado:'Activo' },
  { id:'TG016', codigo:'TG016', nombre:'Departamento',            tipo:'dato-adicional', descripcion:'Descripción del departamento o unidad inmobiliaria', estado:'Activo' },
  { id:'TG017', codigo:'TG017', nombre:'Local Comercial',         tipo:'dato-adicional', descripcion:'Descripción del local comercial vinculado',    estado:'Activo' },
];

const DEF_TIPOS_CASO: TipoCaso[] = [
  { id:'TC001', codigo:'ODSD', nombre:'Obligación de Dar Suma de Dinero', entidad:'Persona Natural', moneda:'PEN', montoBase:0,      estado:'Activo' },
  { id:'TC002', codigo:'EGH',  nombre:'Ejecución de Garantía Hipotecaria', entidad:'Persona Natural', moneda:'PEN', montoBase:0,     estado:'Activo' },
  { id:'TC003', codigo:'INC',  nombre:'Incumplimiento de Contrato',        entidad:'Persona Natural', moneda:'PEN', montoBase:0,     estado:'Activo' },
  { id:'TC004', codigo:'PA',   nombre:'Proceso Abreviado',                 entidad:'Persona Natural', moneda:'PEN', montoBase:0,     estado:'Activo' },
  { id:'TC005', codigo:'ODSD', nombre:'Obligación de Dar Suma de Dinero', entidad:'Empresa',         moneda:'PEN', montoBase:5000,   estado:'Activo' },
  { id:'TC006', codigo:'EGH',  nombre:'Ejecución de Garantía Hipotecaria', entidad:'Empresa',         moneda:'PEN', montoBase:15000, estado:'Activo' },
  { id:'TC007', codigo:'PA',   nombre:'Proceso Abreviado',                 entidad:'Empresa',         moneda:'PEN', montoBase:2000,  estado:'Activo' },
  { id:'TC008', codigo:'ODSD', nombre:'Obligación de Dar Suma de Dinero', entidad:'Banco',            moneda:'PEN', montoBase:10000, estado:'Activo' },
  { id:'TC009', codigo:'EGH',  nombre:'Ejecución de Garantía Hipotecaria', entidad:'Banco',            moneda:'PEN', montoBase:30000, estado:'Activo' },
  { id:'TC010', codigo:'PA',   nombre:'Proceso Abreviado',                 entidad:'Banco',            moneda:'PEN', montoBase:5000,  estado:'Activo' },
  { id:'TC011', codigo:'EGP', nombre:'Ejecución de Garantía Prendaria',   entidad:'Banco',            moneda:'PEN', montoBase:8000,  estado:'Activo' },
  { id:'TC012', codigo:'CBC', nombre:'Cobro de Crédito Bancario',         entidad:'Banco',            moneda:'PEN', montoBase:12000, estado:'Activo' },
];

const DEF_ETAPAS_PROC: ConfigEtapa[] = [
  { id:'CE001', entidad:'Personas Naturales', banco:'', clientes:['Todos'], aplicativo:'SPJ', descripcion:'Etapas para personas naturales', estado:'Activo', duraciones:[], etapas:[
    { id:'E001', nombre:'Actos Preparatorios', tiposProceso:['ODSD','EGH'], tipoEtapa:'Obligatoria'    },
    { id:'E002', nombre:'Etapa Postulatoria',  tiposProceso:['ODSD'],       tipoEtapa:'Obligatoria'    },
  ]},
  { id:'CE002', entidad:'Empresas', banco:'', clientes:['Todos'], aplicativo:'SPJ', descripcion:'Etapas para empresas', estado:'Activo', duraciones:[], etapas:[
    { id:'E001', nombre:'Actos Preparatorios', tiposProceso:['EGH'],        tipoEtapa:'Obligatoria'    },
    { id:'E002', nombre:'Etapa Postulatoria',  tiposProceso:['EGH'],        tipoEtapa:'Obligatoria'    },
    { id:'E003', nombre:'Etapa Probatoria',    tiposProceso:['INC'],        tipoEtapa:'No Obligatoria' },
  ]},
  { id:'CE003', entidad:'Bancos', banco:'BCP', clientes:['Todos'], aplicativo:'SPJ', descripcion:'Etapas para créditos BCP', estado:'Activo', duraciones:[], etapas:[
    { id:'E001', nombre:'Actos Preparatorios', tiposProceso:['ODSD','EGH'], tipoEtapa:'Obligatoria'    },
    { id:'E002', nombre:'Etapa Postulatoria',  tiposProceso:['ODSD'],       tipoEtapa:'Obligatoria'    },
    { id:'E003', nombre:'Etapa de Ejecución',  tiposProceso:['PA'],         tipoEtapa:'Obligatoria'    },
    { id:'E004', nombre:'Liquidación Final',   tiposProceso:['INC','PA'],   tipoEtapa:'No Obligatoria' },
  ]},
];

const DEF_SUBETAPAS_PROC: ConfigSubEtapa[] = [
  { id:'SE001', entidad:'Personas Naturales', clientes:['Todos'], etapaId:'E001', etapaNombre:'Actos Preparatorios', estado:'Activo', subestados:[
    { id:'SS001', nombre:'Revisión de documentos',  descripcion:'Verificar documentación inicial',   estado:'Activo' },
    { id:'SS002', nombre:'Notificación al deudor',  descripcion:'Envío de carta notarial',            estado:'Activo' },
  ]},
  { id:'SE002', entidad:'Empresas', clientes:['Todos'], etapaId:'E001', etapaNombre:'Actos Preparatorios', estado:'Activo', subestados:[
    { id:'SS001', nombre:'Revisión de documentos',         descripcion:'Verificar documentación societaria',  estado:'Activo' },
    { id:'SS002', nombre:'Notificación a representante',   descripcion:'Envío de requerimiento formal',       estado:'Activo' },
    { id:'SS003', nombre:'Análisis de garantías',          descripcion:'Evaluación de garantías ofrecidas',   estado:'Activo' },
  ]},
  { id:'SE003', entidad:'Bancos', clientes:['BCP – Banco de Crédito'], etapaId:'E001', etapaNombre:'Actos Preparatorios', estado:'Activo', subestados:[
    { id:'SS001', nombre:'Calificación del crédito', descripcion:'Verificación del título ejecutivo',  estado:'Activo' },
    { id:'SS002', nombre:'Liquidación de deuda',     descripcion:'Cálculo del monto adeudado',         estado:'Activo' },
    { id:'SS003', nombre:'Requerimiento de pago',    descripcion:'Notificación formal de cobranza',    estado:'Activo' },
  ]},
];

const DEF_TIPOS_GASTO: TipoGasto[] = [
  { id:'GAS001', codigo:'HON', nombre:'Honorarios Profesionales',  descripcion:'Pago por servicios legales del abogado o letrado',   aplicativo:'GAP', tipo:'Administrativo', estado:'Activo' },
  { id:'GAS002', codigo:'ARA', nombre:'Aranceles Judiciales',       descripcion:'Tasas y aranceles requeridos por el juzgado',        aplicativo:'GAP', tipo:'Judicial',       estado:'Activo' },
  { id:'GAS003', codigo:'GNO', nombre:'Gastos Notariales',          descripcion:'Diligencias notariales y documentos oficiales',      aplicativo:'GAP', tipo:'Judicial',       estado:'Activo' },
  { id:'GAS004', codigo:'PER', nombre:'Gastos Periciales',          descripcion:'Honorarios de peritos y expertos designados',       aplicativo:'GAP', tipo:'Judicial',       estado:'Activo' },
  { id:'GAS005', codigo:'TRP', nombre:'Gastos de Transporte',       descripcion:'Movilidad para diligencias procesales',             aplicativo:'GAP', tipo:'Administrativo', estado:'Activo' },
  { id:'GAS006', codigo:'COM', nombre:'Comunicaciones',             descripcion:'Correos, courier y gastos de comunicación formal',  aplicativo:'GAP', tipo:'Administrativo', estado:'Activo' },
  { id:'GAS007', codigo:'DEP', nombre:'Depósitos Judiciales',       descripcion:'Depósitos consignados por orden del juzgado',       aplicativo:'GAP', tipo:'Valores',        estado:'Activo' },
  { id:'GAS008', codigo:'OTR', nombre:'Otros Gastos',               descripcion:'Gastos varios no clasificados en otras categorías', aplicativo:'GAP', tipo:'Administrativo', estado:'Activo' },
];

const DEF_TIPOS_ARANCEL: TipoArancel[] = [
  { id:'ARC001', codigo:'R-001', tipoGasto:'REGISTRALES-CASTIGOS', nombre:'NEGATIVO VEHICULAR',   concepto:'Búsqueda negativa de vehículo en Registros Públicos',    costo:12.3,  estado:'Activo' },
  { id:'ARC002', codigo:'R-002', tipoGasto:'REGISTRALES-CASTIGOS', nombre:'COPIA LITERAL',         concepto:'Obtención de copia literal de partida registral',         costo:16.0,  estado:'Activo' },
  { id:'ARC003', codigo:'R-003', tipoGasto:'REGISTRALES-CASTIGOS', nombre:'GRAVAMEN VEHICULAR',    concepto:'Certificado de cargas y gravámenes sobre vehículo',       costo:45.0,  estado:'Activo' },
  { id:'ARC004', codigo:'R-004', tipoGasto:'REGISTRALES-CASTIGOS', nombre:'GRAVAMEN INMUEBLE',     concepto:'Certificado de cargas y gravámenes sobre inmueble',       costo:48.0,  estado:'Activo' },
  { id:'ARC005', codigo:'R-005', tipoGasto:'REGISTRALES-CASTIGOS', nombre:'BÚSQUEDAS',             concepto:'Búsqueda de actos inscritos en Registros Públicos',       costo:15.4,  estado:'Activo' },
  { id:'ARC006', codigo:'N-001', tipoGasto:'NOTIFICACIONES',       nombre:'NOTIFICACIÓN COURIER',  concepto:'Notificación mediante servicio de mensajería courier',    costo:8.5,   estado:'Activo' },
  { id:'ARC007', codigo:'N-002', tipoGasto:'NOTIFICACIONES',       nombre:'CÉDULA JUDICIAL',       concepto:'Notificación mediante cédula presentada al juzgado',     costo:5.0,   estado:'Activo' },
  { id:'ARC008', codigo:'D-001', tipoGasto:'DEMANDA',              nombre:'PRESENTACIÓN DE DEMANDA',concepto:'Tasa judicial por presentación de demanda inicial',      costo:64.0,  estado:'Activo' },
  { id:'ARC009', codigo:'D-002', tipoGasto:'DEMANDA',              nombre:'MEDIDA CAUTELAR',       concepto:'Tasa judicial por solicitud de medida cautelar',         costo:120.0, estado:'Activo' },
  { id:'ARC010', codigo:'D-003', tipoGasto:'DEMANDA',              nombre:'RECURSO DE APELACIÓN',  concepto:'Tasa judicial por recurso de apelación',                 costo:80.0,  estado:'Activo' },
];

const DEF_TIPOS_DOCUMENTO: TipoDocumento[] = [
  { id:'DOC001', codigo:'DEM',  nombre:'Demanda',              descripcion:'Escrito de demanda inicial del proceso judicial',         estado:'Activo' },
  { id:'DOC002', codigo:'SENT', nombre:'Sentencia',             descripcion:'Resolución final emitida por el juzgado',                estado:'Activo' },
  { id:'DOC003', codigo:'AUTO', nombre:'Auto Judicial',         descripcion:'Resolución de trámite o interlocutoria',                 estado:'Activo' },
  { id:'DOC004', codigo:'EXP',  nombre:'Expediente Judicial',  descripcion:'Expediente completo digitalizado del proceso',           estado:'Activo' },
  { id:'DOC005', codigo:'CTR',  nombre:'Contrato',              descripcion:'Contrato o título ejecutivo base de la demanda',         estado:'Activo' },
  { id:'DOC006', codigo:'POD',  nombre:'Poder Notarial',        descripcion:'Poder de representación legal del abogado',              estado:'Activo' },
  { id:'DOC007', codigo:'LIQD', nombre:'Liquidación de Deuda', descripcion:'Estado de cuenta o liquidación del monto adeudado',      estado:'Activo' },
];

const APPS_LIST = ['SCG','SPJ','GAP','GEPDIA'];

function loadLS<T>(key: string, def: T): T {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; }
}
function saveLS(key: string, val: unknown) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, ProductTourComponent,
            UsuarioModalComponent, RestablecerPwdModalComponent, CoberturaTempModalComponent,
            RolModalComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Configuracion implements OnInit {
  private authService = inject(AuthService);
  tour = inject(ProductTourService);

  // ── ViewChild refs para modales externos ────────────────────────────────
  @ViewChild(UsuarioModalComponent)        usuarioModal!: UsuarioModalComponent;
  @ViewChild(RestablecerPwdModalComponent) pwdModal!: RestablecerPwdModalComponent;
  @ViewChild(CoberturaTempModalComponent)  coberturaModal!: CoberturaTempModalComponent;
  @ViewChild(RolModalComponent)            rolModal!: RolModalComponent;

  // ── Visibilidad de modales externos ─────────────────────────────────────
  usuarioModalVisible    = signal(false);
  pwdModalVisible        = signal(false);
  coberturaModalVisible  = signal(false);
  rolModalVisible        = signal(false);
  pwdModalId             = signal<string | null>(null);
  pwdModalLabel          = signal('');
  coberturaTargetId2     = signal<string | null>(null);
  coberturaTargetLabel2  = signal('');

  // ── View state ───────────────────────────────────────────────────────────
  activeView = signal<string>('usuarios');
  sidebarExpanded = signal(true);
  dropdownOpen = signal(false);
  modalActivo = signal('');

  esAdminSigcomt  = computed(() => this.authService.esAdmin());
  esIndependiente = computed(() => this.authService.esIndependiente());

  readonly Math = Math;
  readonly LIMITE_USUARIOS_NOTARIA = 10;
  miNotariaRol = computed(() => this.authService.obtenerAuth()?.rolActivo?.notaria ?? '');
  usuariosEnMiNotaria = computed(() => {
    if (this.esAdminSigcomt()) return 0;
    const notaria = this.miNotariaRol();
    if (!notaria || notaria === 'Todas') return 0;
    return this.usuarios().filter(u => u.notaria === notaria).length;
  });
  userInitials = computed(() => {
    const email = this.authService.obtenerAuth()?.usuario?.email;
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    return parts.map((p: string) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'U';
  });
  userName = computed(() => this.authService.obtenerNombreDisplay());

  titles: Titulo = {
    usuarios:'Seguridad › Usuarios', roles:'Seguridad › Roles',
    clientes:'Catálogos Generales › Clientes', entidades:'Catálogos Generales › Entidades',
    tiposcaso:'Catálogos SPJ › Tipos de Caso', etapas:'Catálogos SPJ › Etapas Procesales',
    subetapas:'Catálogos SPJ › Sub-Etapas',
    juzgados:'Catálogos SPJ › Juzgados', tablas:'Catálogos SPJ › Tablas Generales',
    tiposgasto:'Catálogos GAP › Tipos de Gasto',
    tiposArancel:'Catálogos SCG › Tipos de Arancel',
    tiposDocumento:'Catálogos GEPDIA › Tipos de Documento',
    notarias:'Gestión Sigone › Notarías', aplicativos:'Gestión Sigone › Aplicativos',
    personalizacion:'Personalización › Login',
  };

  // ── Data signals ─────────────────────────────────────────────────────────
  roles    = signal<Rol[]>(loadLS('sigcomt_roles', DEF_ROLES));
  notarias = signal<Notaria[]>(loadLS('sigcomt_notarias', DEF_NOTARIAS));
  usuarios = signal<Usuario[]>(loadLS('sigcomt_usuarios', DEF_USUARIOS));
  clientes = signal<Cliente[]>(loadLS('sigcomt_clientes', DEF_CLIENTES));
  aplicativos = signal<Aplicativo[]>(loadLS('sigcomt_aplicativos', DEF_APLICATIVOS));
  tablas      = signal<TablaGen[]>(loadLS('sigcomt_tablas', DEF_TABLAS));
  etapasProc   = signal<ConfigEtapa[]>(loadLS('sigcomt_etapas_proc', DEF_ETAPAS_PROC));
  subetapasProc = signal<ConfigSubEtapa[]>(loadLS('sigcomt_subetapas_proc', DEF_SUBETAPAS_PROC));
  tiposGasto      = signal<TipoGasto[]>(loadLS('sigcomt_tipos_gasto', DEF_TIPOS_GASTO));
  tiposArancel    = signal<TipoArancel[]>(loadLS('sigcomt_tipos_arancel', DEF_TIPOS_ARANCEL));
  tiposDocumento  = signal<TipoDocumento[]>(loadLS('sigcomt_tipos_documento', DEF_TIPOS_DOCUMENTO));
  tiposCaso       = signal<TipoCaso[]>(loadLS('sigcomt_tipos_caso', DEF_TIPOS_CASO));
  coberturas      = signal<CoberturaTemp[]>(loadLS('sigcomt_coberturas_temp', []));

  notariasActivas = computed(() => this.notarias().filter(n => n.estado === 'Activo'));

  // ── Filter input bindings (plain, written by ngModel) ────────────────────
  fUsrSearch = ''; fUsrNotaria = ''; fUsrEstado = '';
  fRolSearch = ''; fRolTipo = '';   fRolEstado = '';
  fNotSearch = ''; fNotEstado = '';
  fCliSearch = ''; fCliEntidad = ''; fCliEstado = '';
  fAppSearch = ''; fAppNotaria = ''; fAppEstado = '';
  fEtaSearch = ''; fEtaEntidad = ''; fEtaEstado = '';
  fSubSearch = ''; fSubEntidad = ''; fSubEstado = '';
  fGastoSearch = ''; fGastoTipo = ''; fGastoEstado = '';
  fArancelSearch = ''; fArancelEstado = '';
  fDocSearch = ''; fDocEstado = '';
  fTipoCasoSearch = ''; fTipoCasoEntidad = ''; fTipoCasoEstado = '';

  // ── Filter active signals (applied on Filtrar click) ─────────────────────
  usrSearch = signal(''); usrNotariaFil = signal(''); usrEstadoFil = signal('');
  rolSearch = signal(''); rolTipoFil = signal('');    rolEstadoFil = signal('');
  notSearch = signal(''); notEstadoFil = signal('');
  cliSearch = signal(''); cliEntidadFil = signal(''); cliEstadoFil = signal('');
  appSearch = signal(''); appNotariaFil = signal(''); appEstadoFil = signal('');
  tabSearch = signal(''); tabTipoFil = signal('');    tabEstadoFil = signal('');
  etaSearchFil  = signal(''); etaEntidadFil2 = signal(''); etaEstadoFil2 = signal('');
  subSearchFil  = signal(''); subEntidadFil  = signal(''); subEstadoFil  = signal('');
  gastoSearch = signal(''); gastoTipoFil = signal(''); gastoEstadoFil = signal('');
  arancelSearch = signal(''); arancelEstadoFil = signal('');
  docSearch = signal(''); docEstadoFil = signal('');
  tipoCasoSearch = signal(''); tipoCasoEntidadFil = signal(''); tipoCasoEstadoFil = signal('');

  // ── Etapas sub-view state ────────────────────────────────────────────────
  etaProcView      = signal<'list'|'form'>('list');
  etaProcActiveTab = signal<'etapa'|'duracion'>('etapa');
  etaProcEditId    = signal('');
  etaProcPage      = signal(1);
  etaFormPage      = signal(1);

  etaFormEntidad     = signal('Personas Naturales');
  etaFormBancosSel   = signal<string[]>(['Todos']);
  etaFormBancosOpen  = signal(false);
  etaFormClientesSel = signal<string[]>(['Todos']);
  etaFormClientesOpen= signal(false);

  formConfigEtapa   = { descripcion: '', estado: 'Activo' };
  etapasFormList    = signal<EtapaItem[]>([]);
  // ── Duración etapa ───────────────────────────────────────────────────────
  etaDurSubView      = signal<'todos'|'porTipo'>('todos');
  etaDurColAlerta    = signal(true);
  etaDurColMeta      = signal(false);
  etaDurColDEJ       = signal(false);
  etaDuraciones      = signal<DuracionItem[]>([]);
  etaDurCriterios    = signal<string[]>(['']);
  etaDurEditEtapaId  = signal('');
  etaDurEditTipo     = signal('');
  formDuracion       = signal({ diasCaso: 0, diasAlerta: 0, diasMeta: 0, diasDEJ: 0 });

  // ── Sub-Etapas sub-view state ────────────────────────────────────────────
  subProcView       = signal<'list'|'form'>('list');
  subProcEditId     = signal('');
  subProcPage       = signal(1);
  subFormPageSig    = signal(1);

  subFormEntidad     = signal('Personas Naturales');
  subFormClientesSel = signal<string[]>(['Todos']);
  subFormClientesOpen= signal(false);
  subFormEtapaId     = signal('');

  formConfigSubEtapa  = { estado: 'Activo' };
  subEstadosFormList  = signal<SubEstadoItem[]>([]);
  formAgregarSubEstado = { nombre: '', descripcion: '', estado: 'Activo' };
  subErrNombre        = signal(false);

  formAgregarEtapa  = { nombre: '', tipoEtapa: '' };
  etaTiposProcesoSel = signal<string[]>([]);
  etaTipoProcOpened  = signal(false);
  etaErrNombre       = signal(false);
  etaErrTipoProceso  = signal(false);
  etaErrTipoEtapa    = signal(false);

  readonly TIPOS_PROCESO   = ['Todos','ODSD','EGH','INC','PA'];
  readonly TIPOS_ENTIDAD   = ['Personas Naturales','Empresas','Bancos'];

  // ── Computed para formulario de etapas ───────────────────────────────────
  bancosRegistrados = computed(() =>
    this.clientes().filter(c => c.entidad === 'Banco').map(c => c.nombre)
  );
  clientesPorEntidad = computed(() => {
    const e = this.etaFormEntidad();
    if (e === 'Personas Naturales') return this.clientes().filter(c => c.entidad === 'Persona Natural').map(c => c.nombre);
    if (e === 'Empresas')           return this.clientes().filter(c => c.entidad === 'Empresa').map(c => c.nombre);
    if (e === 'Bancos')             return this.clientes().filter(c => c.entidad === 'Banco').map(c => c.nombre);
    return [];
  });

  isDEJVisible = computed(() =>
    this.etaFormEntidad() === 'Bancos' && this.etaFormBancosSel().includes('BCP')
  );

  tiposProcesoDeLasEtapas = computed(() => {
    const all = this.etapasFormList().flatMap(e => e.tiposProceso).filter(t => t !== 'Todos');
    return [...new Set(all)];
  });

  duracionesTabla = computed(() =>
    this.etapasFormList().map(e => ({
      etapa: e,
      dur: this.etaDuraciones().find(d => d.etapaId === e.id && d.tipoProceso === 'Todos') ?? null
    }))
  );

  duracionesPorTipoArr = computed(() =>
    this.etaDurCriterios().map(tipo => ({
      tipo,
      rows: tipo
        ? this.etapasFormList()
            .filter(e => e.tiposProceso.includes(tipo) || e.tiposProceso.includes('Todos'))
            .map(e => ({ etapa: e, dur: this.etaDuraciones().find(d => d.etapaId === e.id && d.tipoProceso === tipo) ?? null }))
        : []
    }))
  );

  // ── Computed filtered lists ───────────────────────────────────────────────
  usuariosFiltrados = computed(() => {
    const q = this.usrSearch().toLowerCase();
    const nf = this.usrNotariaFil(); const ef = this.usrEstadoFil();
    const esSuperAdmin = this.esAdminSigcomt();
    const miNotaria = this.authService.obtenerAuth()?.rolActivo?.notaria ?? '';
    return this.usuarios().filter(u => {
      if (!esSuperAdmin && miNotaria && miNotaria !== 'Todas') {
        if (u.notaria !== miNotaria) return false;
      }
      const mq = !q || (u.nombres+' '+u.apellidos+' '+u.email).toLowerCase().includes(q);
      return mq && (!nf || u.notaria === nf) && (!ef || u.estado === ef);
    });
  });

  rolesFiltrados = computed(() => {
    const q = this.rolSearch().toLowerCase();
    const tf = this.rolTipoFil(); const ef = this.rolEstadoFil();
    const esSuperAdmin = this.esAdminSigcomt();
    const miNotaria = this.miNotariaRol();
    return this.roles().filter(r => {
      if (!esSuperAdmin && r.nombre === 'Administrador Sigcomt') return false;
      if (!esSuperAdmin && miNotaria && miNotaria !== 'Todas') {
        if (r.notaria !== miNotaria && r.notaria !== 'Todas') return false;
      }
      return (!q || r.nombre.toLowerCase().includes(q)) &&
             (!tf || r.tipoUsuario === tf) &&
             (!ef || r.estado === ef);
    });
  });

  notariasFiltradas = computed(() => {
    const q = this.notSearch().toLowerCase();
    const ef = this.notEstadoFil();
    return this.notarias().filter(n =>
      (!q || (n.razon+' '+n.ruc).toLowerCase().includes(q)) &&
      (!ef || n.estado === ef)
    );
  });

  clientesFiltrados = computed(() => {
    const q = this.cliSearch().toLowerCase();
    const ef = this.cliEntidadFil(); const sf = this.cliEstadoFil();
    return this.clientes().filter(c =>
      (!q || (c.nombre+' '+c.nroDoc).toLowerCase().includes(q)) &&
      (!ef || c.entidad === ef) &&
      (!sf || c.estado === sf)
    );
  });

  aplicativosFiltrados = computed(() => {
    const q = this.appSearch().toLowerCase();
    const nf = this.appNotariaFil(); const ef = this.appEstadoFil();
    return this.aplicativos().filter(a =>
      (!q || (a.nombre+' '+a.descripcion).toLowerCase().includes(q)) &&
      (!nf || a.notaria === nf) &&
      (!ef || a.estado === ef)
    );
  });

  tablasFiltradas = computed(() => {
    const q = this.tabSearch().toLowerCase();
    const tf = this.tabTipoFil(); const ef = this.tabEstadoFil();
    return this.tablas().filter(t =>
      (!q || (t.nombre+' '+t.codigo).toLowerCase().includes(q)) &&
      (!tf || t.tipo === tf) &&
      (!ef || t.estado === ef)
    );
  });

  tiposGastoFiltrados = computed(() => {
    const q = this.gastoSearch().toLowerCase();
    const tf = this.gastoTipoFil(); const ef = this.gastoEstadoFil();
    return this.tiposGasto().filter(g =>
      (!q || (g.nombre + ' ' + g.codigo).toLowerCase().includes(q)) &&
      (!tf || g.tipo === tf) &&
      (!ef || g.estado === ef)
    );
  });

  tiposArancelFiltrados = computed(() => {
    const q = this.arancelSearch().toLowerCase();
    const ef = this.arancelEstadoFil();
    return this.tiposArancel().filter(a =>
      (!q || (a.nombre + ' ' + a.codigo).toLowerCase().includes(q)) &&
      (!ef || a.estado === ef)
    );
  });

  tiposDocumentoFiltrados = computed(() => {
    const q = this.docSearch().toLowerCase();
    const ef = this.docEstadoFil();
    return this.tiposDocumento().filter(d =>
      (!q || (d.nombre + ' ' + d.codigo).toLowerCase().includes(q)) &&
      (!ef || d.estado === ef)
    );
  });

  etaConfigFiltradas = computed(() => {
    const q = this.etaSearchFil().toLowerCase();
    const ef = this.etaEntidadFil2(); const sf = this.etaEstadoFil2();
    return this.etapasProc().filter(c =>
      (!q || c.entidad.toLowerCase().includes(q)) &&
      (!ef || c.entidad === ef) &&
      (!sf || c.estado === sf)
    );
  });

  subConfigFiltradas = computed(() => {
    const q = this.subSearchFil().toLowerCase();
    const ef = this.subEntidadFil(); const sf = this.subEstadoFil();
    return this.subetapasProc().filter(c =>
      (!q || (c.entidad + ' ' + c.etapaNombre).toLowerCase().includes(q)) &&
      (!ef || c.entidad === ef) &&
      (!sf || c.estado === sf)
    );
  });

  subClientesPorEntidad = computed(() => {
    const e = this.subFormEntidad();
    if (e === 'Personas Naturales') return this.clientes().filter(c => c.entidad === 'Persona Natural').map(c => c.nombre);
    if (e === 'Empresas')           return this.clientes().filter(c => c.entidad === 'Empresa').map(c => c.nombre);
    if (e === 'Bancos')             return this.clientes().filter(c => c.entidad === 'Banco').map(c => c.nombre);
    return [];
  });

  etasPorEntidadCliente = computed(() => {
    const entidad = this.subFormEntidad();
    const clientes = this.subFormClientesSel();
    const configs = this.etapasProc().filter(c => {
      if (c.entidad !== entidad) return false;
      if (entidad === 'Bancos') {
        if (clientes.includes('Todos')) return true;
        return clientes.some(cl => c.banco === cl || c.banco === 'Todos');
      }
      return true;
    });
    const seen = new Set<string>();
    return configs.flatMap(c => c.etapas).filter(e => {
      const key = e.id + '|' + e.nombre;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  pageSize = signal(5);
  usrPage = signal(1); rolPage = signal(1); cliPage = signal(1);
  entPage = signal(1); tipPage = signal(1); etaPage = signal(1);
  juzPage = signal(1); tabPage = signal(1); notPage = signal(1); appPage = signal(1);
  gastoPage = signal(1); arancelPage = signal(1); docPage = signal(1);

  readonly ENT_TOTAL = 3; readonly TIP_TOTAL = 3;
  readonly ETA_TOTAL = 4; readonly JUZ_TOTAL = 2;

  usrPaginated = computed(() => { const p=this.usrPage(),s=this.pageSize(); return this.usuariosFiltrados().slice((p-1)*s, p*s); });
  rolPaginated = computed(() => { const p=this.rolPage(),s=this.pageSize(); return this.rolesFiltrados().slice((p-1)*s, p*s); });
  cliPaginated = computed(() => { const p=this.cliPage(),s=this.pageSize(); return this.clientesFiltrados().slice((p-1)*s, p*s); });
  tabPaginated = computed(() => { const p=this.tabPage(),s=this.pageSize(); return this.tablasFiltradas().slice((p-1)*s, p*s); });
  notPaginated = computed(() => { const p=this.notPage(),s=this.pageSize(); return this.notariasFiltradas().slice((p-1)*s, p*s); });
  appPaginated        = computed(() => { const p=this.appPage(),s=this.pageSize();     return this.aplicativosFiltrados().slice((p-1)*s, p*s); });
  gastoPaginated      = computed(() => { const p=this.gastoPage(),s=this.pageSize();    return this.tiposGastoFiltrados().slice((p-1)*s, p*s); });
  arancelPaginated    = computed(() => { const p=this.arancelPage(),s=this.pageSize();  return this.tiposArancelFiltrados().slice((p-1)*s, p*s); });
  docPaginated        = computed(() => { const p=this.docPage(),s=this.pageSize();      return this.tiposDocumentoFiltrados().slice((p-1)*s, p*s); });
  tiposCasoFiltrados  = computed(() => {
    const q = this.tipoCasoSearch().toLowerCase();
    const ef = this.tipoCasoEntidadFil(); const sf = this.tipoCasoEstadoFil();
    return this.tiposCaso().filter(t =>
      (!q || (t.nombre + ' ' + t.codigo).toLowerCase().includes(q)) &&
      (!ef || t.entidad === ef) && (!sf || t.estado === sf)
    );
  });
  tiposCasoPaginated  = computed(() => { const p=this.tipPage(),s=this.pageSize(); return this.tiposCasoFiltrados().slice((p-1)*s, p*s); });
  etaConfigPaginated  = computed(() => { const p=this.etaProcPage(),s=this.pageSize(); return this.etaConfigFiltradas().slice((p-1)*s, p*s); });
  etaFormPaginated    = computed(() => { const p=this.etaFormPage(),s=this.pageSize(); return this.etapasFormList().slice((p-1)*s, p*s); });
  subConfigPaginated  = computed(() => { const p=this.subProcPage(),s=this.pageSize(); return this.subConfigFiltradas().slice((p-1)*s, p*s); });
  subFormPaginated    = computed(() => { const p=this.subFormPageSig(),s=this.pageSize(); return this.subEstadosFormList().slice((p-1)*s, p*s); });

  totalPages(total: number): number { return Math.max(1, Math.ceil(total / this.pageSize())); }

  setPage(sig: WritableSignal<number>, val: number, total: number) {
    sig.set(Math.min(Math.max(1, val), this.totalPages(total)));
  }

  setPageSize(val: string | number) {
    this.pageSize.set(+val);
    [this.usrPage, this.rolPage, this.cliPage, this.entPage, this.tipPage,
     this.etaPage, this.juzPage, this.tabPage, this.notPage, this.appPage,
     this.gastoPage, this.arancelPage, this.docPage,
     this.etaProcPage, this.etaFormPage, this.subProcPage, this.subFormPageSig
    ].forEach(p => p.set(1));
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  toastMsg = signal('');
  toastVisible = signal(false);
  private toastTimer?: ReturnType<typeof setTimeout>;

  showToast(msg: string) {
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 3000);
  }

  // ── MODAL: Usuario ────────────────────────────────────────────────────────
  editingUsrId: string | null = null;
  usrReadonly = signal(false);
  usrModalTitle = signal('Nuevo Usuario');
  usrRolesTemp = signal<RolAsignado[]>([]);
  showEstadoUsr = signal(false);
  showCondicion = signal(false);
  showComision  = signal(false);
  showAbogado   = signal(false);
  usrAbogadosAsistidos = signal<string[]>([]);
  formUsr = { email:'', nombres:'', apellidos:'', celular:'', pwd:'', pwd2:'', estado:'Activo', condicion:'', comision:'3', tipoUsuario:'', abogadoAsociado:'' };

  abogadosPorNotaria = computed(() => {
    const notaria = this.usrRolesTemp()[0]?.notaria ?? '';
    return this.usuarios().filter(u =>
      u.tipoUsuario === 'Abogado' && u.estado === 'Activo' &&
      (notaria === 'Todas' || u.notaria === notaria || u.notaria === 'Todas') &&
      u.id !== this.editingUsrId
    );
  });

  toggleAbogadoAsistido(id: string) {
    this.usrAbogadosAsistidos.update(arr =>
      arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]
    );
  }

  // ── MODAL USUARIO — usa UsuarioModalComponent ────────────────────────────
  abrirModalUsuario() {
    if (this.esIndependiente()) { this.openModal('plan-restriction-users'); return; }
    this.usuarioModal.openNew();
    this.usuarioModalVisible.set(true);
  }

  editarUsuario(id: string) {
    const u = this.usuarios().find(x => x.id === id); if (!u) return;
    this.usuarioModal.openEdit(u);
    this.usuarioModalVisible.set(true);
  }

  verUsuario(id: string) {
    const u = this.usuarios().find(x => x.id === id); if (!u) return;
    this.usuarioModal.openView(u);
    this.usuarioModalVisible.set(true);
  }

  onUsuarioSaved(evt: { usuario: any; isNew: boolean }) {
    const list = [...this.usuarios()];
    if (evt.isNew) {
      list.push(evt.usuario);
    } else {
      const idx = list.findIndex(u => u.id === evt.usuario.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...evt.usuario };
    }
    this.usuarios.set(list); saveLS('sigcomt_usuarios', list);
    this.showToast(evt.isNew ? 'Usuario creado' : 'Usuario actualizado');
  }

  // ── MODAL CONTRASEÑA — usa RestablecerPwdModalComponent ─────────────────
  abrirCambioPwd(id: string) {
    const u = this.usuarios().find(x => x.id === id); if (!u) return;
    this.pwdModalId.set(id);
    this.pwdModalLabel.set(u.username);
    this.pwdModal.open();
    this.pwdModalVisible.set(true);
  }

  onPwdGuardada(evt: { id: string; pwdHash: string }) {
    const list = this.usuarios().map(u => u.id === evt.id ? { ...u, pwd: evt.pwdHash } : u);
    this.usuarios.set(list); saveLS('sigcomt_usuarios', list);
    this.pwdModalVisible.set(false);
    this.showToast('Contraseña actualizada');
  }

  // ── MODAL COBERTURA — usa CoberturaTempModalComponent ───────────────────
  coberturaTargetNotaria = signal('');

  usuariosPorNotaria = computed(() => {
    const notaria = this.coberturaTargetNotaria();
    const targetId = this.coberturaTargetId2();
    return this.usuarios().filter(u =>
      u.estado === 'Activo' && u.id !== targetId &&
      (notaria === 'Todas' || u.notaria === notaria)
    );
  });

  coberturaActivaParaUsuario(usuarioId: string): CoberturaTemp | undefined {
    const hoy = new Date().toISOString().split('T')[0];
    return this.coberturas().find(c =>
      c.usuarioId === usuarioId && c.fechaFin >= hoy && c.fechaInicio <= hoy
    );
  }

  abrirCobertura(id: string) {
    const u = this.usuarios().find(x => x.id === id); if (!u) return;
    this.coberturaTargetId2.set(id);
    this.coberturaTargetLabel2.set(u.nombres + ' ' + u.apellidos);
    this.coberturaTargetNotaria.set(u.notaria);
    this.coberturaModal.open();
    this.coberturaModalVisible.set(true);
  }

  onCoberturaRegistrada(data: Omit<CoberturaTemp, 'id'>) {
    const list = [...this.coberturas()];
    list.push({ id: 'COB' + String(list.length + 1).padStart(3, '0'), ...data });
    this.coberturas.set(list); saveLS('sigcomt_coberturas_temp', list);
    this.showToast('Cobertura temporal registrada');
  }

  eliminarCobertura(id: string) {
    const list = this.coberturas().filter(c => c.id !== id);
    this.coberturas.set(list); saveLS('sigcomt_coberturas_temp', list);
    this.showToast('Cobertura eliminada');
  }

  // ── Legado: métodos internos que quedaron en el HTML de otros modales ────
  addRolNotariaSel = signal('');
  addRolSel = '';
  rolesPorNotaria = computed(() => this.roles().filter(r => r.estado === 'Activo'));
  onAddRolNotariaChange(val: string) { this.addRolNotariaSel.set(val); this.addRolSel = ''; }
  confirmarAddRol() { /* ya no se usa — gestionado por UsuarioModalComponent */ }
  pwdTargetId: string | null = null;
  pwdLabel = signal('');
  formPwd = { nueva:'', nueva2:'' };
  guardarPwd() { /* ya no se usa — gestionado por RestablecerPwdModalComponent */ }
  coberturaTargetId: string | null = null;
  coberturaTargetLabel = signal('');
  formCobertura = { usuarioCubiertoId: '', motivo: '', fechaInicio: '', fechaFin: '' };
  guardarCobertura() { /* ya no se usa — gestionado por CoberturaTempModalComponent */ }

  // ── MODAL ROL — usa RolModalComponent ───────────────────────────────────
  abrirModalRol() {
    this.rolModal.openNew();
    this.rolModalVisible.set(true);
  }

  editarRol(id: string) {
    const r = this.roles().find(x => x.id === id); if (!r) return;
    if (!this.esAdminSigcomt() && r.nombre === 'Administrador Sigcomt') {
      this.showToast('No tienes permisos para ver o editar este rol');
      return;
    }
    this.rolModal.openEdit(r);
    this.rolModalVisible.set(true);
  }

  onRolSaved(evt: { rol: any; isNew: boolean }) {
    const list = [...this.roles()];
    if (evt.isNew) {
      list.push(evt.rol);
    } else {
      const idx = list.findIndex(r => r.id === evt.rol.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...evt.rol };
    }
    this.roles.set(list); saveLS('sigcomt_roles', list);
    this.showToast(evt.isNew ? 'Rol creado' : 'Rol actualizado');
  }

  contarUsrPorRol(nombre: string): number {
    return this.usuarios().filter(u => u.roles.some(r => r.rol === nombre)).length;
  }

  // Legado: mantenidos por referencias en otros lugares del template
  editingRolId: string | null = null;
  rolModalTitle = signal('Nuevo Rol');
  showEstadoRol = signal(false);
  formRol = { nombre:'', descripcion:'', tipoUsuario:'', app:'TODOS', notaria:'Todas', estado:'Activo' };
  readonly MODULOS_PERMISOS: any[] = [];
  permisosRol: Record<string, any> = {};
  guardarRol() { /* gestionado por RolModalComponent */ }

  // ── MODAL: Notaría ────────────────────────────────────────────────────────
  editingNotId: string | null = null;
  notModalTitle = signal('Nueva Notaría');
  showEstadoNot = signal(false);
  notAppsSeleccionados = signal<string[]>([]);
  formNot = { razon:'', notario:'', ruc:'', distrito:'', telefono:'', email:'', direccion:'', estado:'Activo', gepdia_consultas:100, gepdia_cargas:300 };
  readonly APPS_LIST = APPS_LIST;

  abrirModalNotaria() {
    this.editingNotId = null; this.notModalTitle.set('Nueva Notaría'); this.showEstadoNot.set(false);
    this.formNot = { razon:'', notario:'', ruc:'', distrito:'', telefono:'', email:'', direccion:'', estado:'Activo', gepdia_consultas:100, gepdia_cargas:300 };
    this.notAppsSeleccionados.set([]);
    this.openModal('notaria');
  }

  editarNotaria(id: string) {
    const n = this.notarias().find(x => x.id === id); if (!n) return;
    this.editingNotId = id; this.notModalTitle.set('Editar Notaría'); this.showEstadoNot.set(true);
    this.formNot = { razon:n.razon, notario:n.notario, ruc:n.ruc, distrito:n.distrito, telefono:n.telefono, email:n.email, direccion:n.direccion, estado:n.estado, gepdia_consultas:n.gepdia_consultas??100, gepdia_cargas:n.gepdia_cargas??300 };
    this.notAppsSeleccionados.set([...n.apps]);
    this.openModal('notaria');
  }

  verNotaria(id: string) { this.editarNotaria(id); this.notModalTitle.set('Detalle Notaría'); }

  toggleApp(app: string) {
    this.notAppsSeleccionados.update(arr =>
      arr.includes(app) ? arr.filter(a => a !== app) : [...arr, app]
    );
  }

  isAppSelected(app: string): boolean { return this.notAppsSeleccionados().includes(app); }

  guardarNotaria() {
    const f = this.formNot;
    if (!f.razon || !f.ruc || !f.email) { this.showToast('Razón Social, RUC y Email son obligatorios'); return; }
    if (!this.notAppsSeleccionados().length) { this.showToast('Selecciona al menos un aplicativo'); return; }
    const list = [...this.notarias()];
    if (this.editingNotId) {
      const idx = list.findIndex(n => n.id === this.editingNotId);
      list[idx] = { ...list[idx], ...f, apps:[...this.notAppsSeleccionados()] };
    } else {
      if (list.find(n => n.ruc === f.ruc || n.razon === f.razon)) { this.showToast('RUC o Razón Social ya registrada'); return; }
      list.push({ id:'N'+String(list.length+1).padStart(3,'0'), ...f, apps:[...this.notAppsSeleccionados()], gepdia_consultas_usadas:0, gepdia_cargas_usadas:0 });
    }
    this.notarias.set(list); saveLS('sigcomt_notarias', list);
    this.closeModal(); this.showToast(this.editingNotId ? 'Notaría actualizada' : 'Notaría registrada');
  }

  // ── MODAL: Cliente ────────────────────────────────────────────────────────
  editingCliId: string | null = null;
  cliReadonly = signal(false);
  cliModalTitle = signal('Nuevo Cliente');
  showEstadoCli = signal(false);
  showCliCorreo = signal(false);
  showCliContactos = signal(false);
  contactosTemp = signal<Contacto[]>([]);
  formCli = { nombre:'', tipoDoc:'DNI', nroDoc:'', entidad:'', correo:'', estado:'Activo' };
  formContacto = { nombre:'', cargo:'', correo:'', telefono:'' };

  nuevoCliente() {
    this.editingCliId = null; this.cliReadonly.set(false);
    this.cliModalTitle.set('Nuevo Cliente'); this.showEstadoCli.set(false);
    this.contactosTemp.set([]); this.showCliCorreo.set(false); this.showCliContactos.set(false);
    this.formCli = { nombre:'', tipoDoc:'DNI', nroDoc:'', entidad:'', correo:'', estado:'Activo' };
    this.formContacto = { nombre:'', cargo:'', correo:'', telefono:'' };
    this.openModal('cliente');
  }

  editarCliente(id: string) {
    const c = this.clientes().find(x => x.id === id); if (!c) return;
    this.editingCliId = id; this.cliReadonly.set(false);
    this.cliModalTitle.set('Editar Cliente'); this.showEstadoCli.set(true);
    this.contactosTemp.set(c.contactos.map(x => ({...x})));
    this.formCli = { nombre:c.nombre, tipoDoc:c.tipoDoc, nroDoc:c.nroDoc, entidad:c.entidad, correo:c.correo, estado:c.estado };
    this.formContacto = { nombre:'', cargo:'', correo:'', telefono:'' };
    this._updateCliFields();
    this.openModal('cliente');
  }

  verCliente(id: string) { this.editarCliente(id); this.cliModalTitle.set('Detalle Cliente'); this.cliReadonly.set(true); }

  onEntidadChange() { this._updateCliFields(); }

  private _updateCliFields() {
    const ent = this.formCli.entidad;
    this.showCliCorreo.set(ent === 'Persona Natural');
    this.showCliContactos.set(!!ent);
  }

  agregarContacto() {
    const f = this.formContacto;
    if (!f.nombre.trim()) { this.showToast('El nombre del contacto es obligatorio'); return; }
    const principal = !this.contactosTemp().length;
    this.contactosTemp.update(arr => [...arr, { nombre:f.nombre.trim(), cargo:f.cargo, correo:f.correo, telefono:f.telefono, principal }]);
    this.formContacto = { nombre:'', cargo:'', correo:'', telefono:'' };
  }

  eliminarContacto(idx: number) {
    this.contactosTemp.update(arr => {
      const next = arr.filter((_, i) => i !== idx);
      if (next.length && !next.some(c => c.principal)) next[0].principal = true;
      return next;
    });
  }

  setPrincipalContacto(idx: number) {
    this.contactosTemp.update(arr => arr.map((c, i) => ({...c, principal: i === idx})));
  }

  guardarCliente() {
    const f = this.formCli;
    if (!f.nombre || !f.nroDoc || !f.entidad) { this.showToast('Nombre, documento y entidad son obligatorios'); return; }
    if ((f.entidad === 'Empresa' || f.entidad === 'Banco') && !this.contactosTemp().length) { this.showToast('Agrega al menos un contacto'); return; }
    const list = [...this.clientes()];
    if (this.editingCliId) {
      const idx = list.findIndex(c => c.id === this.editingCliId);
      list[idx] = { ...list[idx], ...f, contactos:[...this.contactosTemp()] };
    } else {
      list.push({ id:'CL'+String(list.length+1).padStart(3,'0'), ...f, contactos:[...this.contactosTemp()] });
    }
    this.clientes.set(list); saveLS('sigcomt_clientes', list);
    this.closeModal(); this.showToast(this.editingCliId ? 'Cliente actualizado' : 'Cliente registrado');
  }

  getContactoDisplay(c: Cliente): string {
    if (c.entidad === 'Persona Natural') return c.correo || '—';
    const ct = c.contactos.find(x => x.principal) || c.contactos[0];
    return ct ? ct.nombre : '—';
  }

  // ── MODAL: Aplicativo ─────────────────────────────────────────────────────
  editingAppId: string | null = null;
  appModalTitle = signal('Nuevo Aplicativo');
  showEstadoApp = signal(false);
  formApp = { notaria:'', nombre:'', descripcion:'', url:'', estado:'Activo' };

  abrirModalAplicativo() {
    this.editingAppId = null; this.appModalTitle.set('Nuevo Aplicativo'); this.showEstadoApp.set(false);
    this.formApp = { notaria:'', nombre:'', descripcion:'', url:'', estado:'Activo' };
    this.openModal('aplicativo');
  }

  editarAplicativo(id: string) {
    const a = this.aplicativos().find(x => x.id === id); if (!a) return;
    this.editingAppId = id; this.appModalTitle.set('Editar Aplicativo'); this.showEstadoApp.set(true);
    this.formApp = { notaria:a.notaria, nombre:a.nombre, descripcion:a.descripcion, url:a.url, estado:a.estado };
    this.openModal('aplicativo');
  }

  guardarAplicativo() {
    const f = this.formApp;
    if (!f.notaria || !f.nombre) { this.showToast('Notaría y Nombre son obligatorios'); return; }
    const list = [...this.aplicativos()];
    if (this.editingAppId) {
      const idx = list.findIndex(a => a.id === this.editingAppId);
      list[idx] = { ...list[idx], ...f };
    } else {
      list.push({ id:'AP'+String(list.length+1).padStart(3,'0'), ...f, icono:'' });
    }
    this.aplicativos.set(list); saveLS('sigcomt_aplicativos', list);
    this.closeModal(); this.showToast(this.editingAppId ? 'Aplicativo actualizado' : 'Aplicativo registrado');
  }

  // ── Personalización ───────────────────────────────────────────────────────
  private readonly DEF_BANNERS = ['assets/img/Banner3_1.png','assets/img/Banner3_2.png','assets/img/Banner3_3.png'];
  loginCfg = {
    titulo: 'Suite de Procesos Judiciales',
    subtitulo: 'Plataforma integral para la gestión de procesos judiciales',
    logoPos: 'center',
    tituloBold: false,    tituloItalic: false,
    subtituloBold: false, subtituloItalic: false,
    tituloSize: 'md',    subtituloSize: 'sm',
    tituloColor: '#ffffff', subtituloColor: '#e2e8f0',
    tituloAlign: 'center',  subtituloAlign: 'center',
    ...loadLS<any>('sigcomt_login_cfg', {})
  };
  loginBanners = signal<string[]>(
    (loadLS<any>('sigcomt_login_cfg', {}).banners) ?? ['assets/img/Banner3_1.png','assets/img/Banner3_2.png','assets/img/Banner3_3.png']
  );
  previewBannerIdx = signal(0);
  previewModalOpen = signal(false);

  guardarPersonalizacion() {
    const cfg = { ...this.loginCfg, banners: this.loginBanners() };
    saveLS('sigcomt_login_cfg', cfg);
    this.showToast('Configuración guardada');
  }

  restablecerLogin() {
    this.loginCfg = {
      titulo: 'Suite de Procesos Judiciales',
      subtitulo: 'Plataforma integral para la gestión de procesos judiciales',
      logoPos: 'center',
      tituloBold: false, tituloItalic: false, subtituloBold: false, subtituloItalic: false,
      tituloSize: 'md', subtituloSize: 'sm',
      tituloColor: '#ffffff', subtituloColor: '#e2e8f0',
      tituloAlign: 'center', subtituloAlign: 'center',
    };
    this.loginBanners.set(['assets/img/Banner3_1.png','assets/img/Banner3_2.png','assets/img/Banner3_3.png']);
    this.showToast('Configuración restablecida');
  }

  previewTxtSize(size: string, isTitle: boolean): string {
    const t: Record<string,string> = { sm:'11px', md:'15px', lg:'19px', xl:'24px' };
    const s: Record<string,string> = { sm:'8px',  md:'11px', lg:'13px', xl:'16px' };
    return isTitle ? (t[size] ?? '15px') : (s[size] ?? '8px');
  }

  posJustify(pos: string): string {
    if (pos.startsWith('top')) return 'flex-start';
    if (pos.startsWith('bot')) return 'flex-end';
    return 'center';
  }

  posAlign(pos: string): string {
    if (pos === 'left'  || pos.endsWith('left'))  return 'flex-start';
    if (pos === 'right' || pos.endsWith('right')) return 'flex-end';
    return 'center';
  }

  onBannerFileChange(idx: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.loginBanners.update(arr => { const n = [...arr]; n[idx] = result; return n; });
      this.previewBannerIdx.set(idx);
    };
    reader.readAsDataURL(file);
  }

  resetBanner(idx: number) {
    this.loginBanners.update(arr => {
      const n = [...arr];
      n[idx] = this.DEF_BANNERS[idx];
      return n;
    });
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.showView('usuarios');
    if (!this.esAdminSigcomt()) {
      const notaria = this.miNotariaRol();
      if (notaria && notaria !== 'Todas') {
        this.fUsrNotaria = notaria;
        this.usrNotariaFil.set(notaria);
      }
    }
  }

  showView(viewId: string) {
    if ((viewId === 'notarias' || viewId === 'aplicativos') && !this.esAdminSigcomt()) {
      alert('Acceso restringido — solo Administrador Sigcomt'); return;
    }
    this.activeView.set(viewId); this.dropdownOpen.set(false);
  }

  toggleSidebar() { this.sidebarExpanded.update(v => !v); }
  toggleDropdown() { this.dropdownOpen.update(v => !v); }
  doLogout() { this.authService.logout(); }
  openModal(id: string) { this.modalActivo.set(id); }
  closeModal() { this.modalActivo.set(''); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  iniciales(nombres: string, apellidos: string): string {
    return ((nombres?.[0] ?? '?') + (apellidos?.[0] ?? '?')).toUpperCase();
  }

  filtrarUsuarios()  { this.usrPage.set(1); this.usrSearch.set(this.fUsrSearch); this.usrNotariaFil.set(this.fUsrNotaria); this.usrEstadoFil.set(this.fUsrEstado); }
  filtrarRoles()     { this.rolPage.set(1); this.rolSearch.set(this.fRolSearch); this.rolTipoFil.set(this.fRolTipo); this.rolEstadoFil.set(this.fRolEstado); }
  filtrarNotarias()  { this.notPage.set(1); this.notSearch.set(this.fNotSearch); this.notEstadoFil.set(this.fNotEstado); }
  filtrarClientes()  { this.cliPage.set(1); this.cliSearch.set(this.fCliSearch); this.cliEntidadFil.set(this.fCliEntidad); this.cliEstadoFil.set(this.fCliEstado); }
  filtrarAplicativos() { this.appPage.set(1); this.appSearch.set(this.fAppSearch); this.appNotariaFil.set(this.fAppNotaria); this.appEstadoFil.set(this.fAppEstado); }

  previewAvatar(input: HTMLInputElement) {}
  previewLogo(input: HTMLInputElement) {}
  previewAppIcono(input: HTMLInputElement) {}
  setPos(pos: string, btn: HTMLElement) {}
  buildPermisosGrid() {}

  // ── MODAL: Entidad (catálogo estático) ────────────────────────────────────
  entidadModalTitle = signal('Nueva Entidad');
  formEntidad = { nombre: '', descripcion: '', estado: 'Activo' };

  abrirModalEntidad(nombre = '', descripcion = '') {
    this.entidadModalTitle.set(nombre ? 'Editar Entidad' : 'Nueva Entidad');
    this.formEntidad = { nombre, descripcion, estado: 'Activo' };
    this.openModal('entidad');
  }

  guardarEntidad() {
    if (!this.formEntidad.nombre) { this.showToast('El nombre es obligatorio'); return; }
    this.closeModal(); this.showToast(this.formEntidad.nombre ? 'Entidad guardada' : 'Entidad creada');
  }

  // ── Tipo de Caso ──────────────────────────────────────────────────────────
  editingTipoCasoId: string | null = null;
  tipoCasoModalTitle = signal('Nuevo Tipo de Caso');
  showEstadoTipoCaso = signal(false);
  formTipoCaso = { codigo:'', nombre:'', entidad:'', moneda:'PEN', montoBase:0, estado:'Activo' };

  filtrarTipoCaso() {
    this.tipoCasoSearch.set(this.fTipoCasoSearch);
    this.tipoCasoEntidadFil.set(this.fTipoCasoEntidad);
    this.tipoCasoEstadoFil.set(this.fTipoCasoEstado);
    this.tipPage.set(1);
  }

  limpiarTipoCaso() {
    this.fTipoCasoSearch = ''; this.fTipoCasoEntidad = ''; this.fTipoCasoEstado = '';
    this.tipoCasoSearch.set(''); this.tipoCasoEntidadFil.set(''); this.tipoCasoEstadoFil.set('');
    this.tipPage.set(1);
  }

  abrirModalTipoCaso() {
    this.editingTipoCasoId = null;
    this.tipoCasoModalTitle.set('Nuevo Tipo de Caso');
    this.showEstadoTipoCaso.set(false);
    this.formTipoCaso = { codigo:'', nombre:'', entidad:'', moneda:'PEN', montoBase:0, estado:'Activo' };
    this.openModal('tipocaso');
  }

  editarTipoCaso(id: string) {
    const t = this.tiposCaso().find(x => x.id === id); if (!t) return;
    this.editingTipoCasoId = id;
    this.tipoCasoModalTitle.set('Editar Tipo de Caso');
    this.showEstadoTipoCaso.set(true);
    this.formTipoCaso = { codigo:t.codigo, nombre:t.nombre, entidad:t.entidad, moneda:t.moneda, montoBase:t.montoBase, estado:t.estado };
    this.openModal('tipocaso');
  }

  guardarTipoCaso() {
    const f = this.formTipoCaso;
    if (!f.nombre.trim()) { this.showToast('El nombre es obligatorio'); return; }
    if (!f.entidad) { this.showToast('Selecciona la entidad'); return; }
    const list = [...this.tiposCaso()];
    if (this.editingTipoCasoId) {
      const idx = list.findIndex(t => t.id === this.editingTipoCasoId);
      list[idx] = { ...list[idx], ...f };
    } else {
      list.push({ id:'TC'+String(list.length+1).padStart(3,'0'), ...f });
    }
    this.tiposCaso.set(list); saveLS('sigcomt_tipos_caso', list);
    this.closeModal(); this.showToast(this.editingTipoCasoId ? 'Tipo de caso actualizado' : 'Tipo de caso creado');
  }

  // ── Etapas Procesales ─────────────────────────────────────────────────────
  filtrarEtapas() {
    this.etaSearchFil.set(this.fEtaSearch);
    this.etaEntidadFil2.set(this.fEtaEntidad);
    this.etaEstadoFil2.set(this.fEtaEstado);
    this.etaProcPage.set(1);
  }

  private resetEtaForm() {
    this.etaFormEntidad.set('Personas Naturales');
    this.etaFormBancosSel.set(['Todos']);
    this.etaFormBancosOpen.set(false);
    this.etaFormClientesSel.set(['Todos']);
    this.etaFormClientesOpen.set(false);
    this.etaDurSubView.set('todos');
    this.etaDurColAlerta.set(true);
    this.etaDurColMeta.set(false);
    this.etaDurColDEJ.set(false);
    this.etaDuraciones.set([]);
    this.etaDurCriterios.set(['']);
  }

  nuevaConfigEtapa() {
    this.resetEtaForm();
    this.formConfigEtapa = { descripcion: '', estado: 'Activo' };
    this.etapasFormList.set([
      { id: 'E001', nombre: 'Actos Preparatorios', tiposProceso: ['ODSD', 'EGH'], tipoEtapa: 'Obligatoria' }
    ]);
    this.etaProcEditId.set('');
    this.etaProcActiveTab.set('etapa');
    this.etaFormPage.set(1);
    this.etaProcView.set('form');
  }

  editarConfigEtapa(id: string) {
    const c = this.etapasProc().find(x => x.id === id);
    if (!c) return;
    this.etaFormEntidad.set(c.entidad);
    this.etaFormBancosSel.set(c.banco ? [c.banco] : ['Todos']);
    this.etaFormClientesSel.set(c.clientes?.length ? c.clientes : ['Todos']);
    this.etaFormBancosOpen.set(false);
    this.etaFormClientesOpen.set(false);
    this.etaDurSubView.set('todos');
    this.etaDurColAlerta.set(true);
    this.etaDurColMeta.set(false);
    this.etaDurColDEJ.set(false);
    this.etaDuraciones.set(c.duraciones ? [...c.duraciones] : []);
    this.etaDurCriterios.set(['']);
    this.formConfigEtapa = { descripcion: c.descripcion, estado: c.estado };
    this.etapasFormList.set([...c.etapas]);
    this.etaProcEditId.set(id);
    this.etaProcActiveTab.set('etapa');
    this.etaFormPage.set(1);
    this.etaProcView.set('form');
  }

  cancelarConfigEtapa() { this.etaProcView.set('list'); }

  guardarConfigEtapa() {
    const bancoVal = this.etaFormEntidad() === 'Bancos'
      ? (this.etaFormBancosSel().includes('Todos') ? 'Todos' : this.etaFormBancosSel().join(', '))
      : '';
    const record: ConfigEtapa = {
      id: this.etaProcEditId() || 'CE' + Date.now(),
      entidad:   this.etaFormEntidad(),
      banco:     bancoVal,
      clientes:  this.etaFormClientesSel(),
      aplicativo:'SPJ',
      descripcion: this.formConfigEtapa.descripcion,
      estado:    this.formConfigEtapa.estado,
      etapas:     this.etapasFormList(),
      duraciones: this.etaDuraciones()
    };
    if (this.etaProcEditId()) {
      this.etapasProc.update(l => l.map(c => c.id === record.id ? record : c));
    } else {
      this.etapasProc.update(l => [...l, record]);
    }
    saveLS('sigcomt_etapas_proc', this.etapasProc());
    this.etaProcView.set('list');
    this.showToast('Configuración guardada');
  }

  toggleFormBanco(banco: string) {
    this.etaFormBancosSel.update(list => {
      if (banco === 'Todos') return ['Todos'];
      const next = list.filter(b => b !== 'Todos');
      const idx = next.indexOf(banco);
      if (idx > -1) next.splice(idx, 1); else next.push(banco);
      return next.length ? [...next] : ['Todos'];
    });
  }

  toggleFormCliente(cliente: string) {
    this.etaFormClientesSel.update(list => {
      if (cliente === 'Todos') return ['Todos'];
      const next = list.filter(c => c !== 'Todos');
      const idx = next.indexOf(cliente);
      if (idx > -1) next.splice(idx, 1); else next.push(cliente);
      return next.length ? [...next] : ['Todos'];
    });
  }

  abrirModalAgregarEtapa() {
    this.formAgregarEtapa = { nombre: '', tipoEtapa: '' };
    this.etaTiposProcesoSel.set([]);
    this.etaTipoProcOpened.set(false);
    this.etaErrNombre.set(false);
    this.etaErrTipoProceso.set(false);
    this.etaErrTipoEtapa.set(false);
    this.openModal('agregarEtapa');
  }

  onEtaNombreChange() { if (this.formAgregarEtapa.nombre.trim()) this.etaErrNombre.set(false); }
  onEtaTipoEtapaChange() { if (this.formAgregarEtapa.tipoEtapa) this.etaErrTipoEtapa.set(false); }

  toggleTipoProceso(tipo: string) {
    this.etaTiposProcesoSel.update(list => {
      if (tipo === 'Todos') {
        return list.includes('Todos') ? [] : ['Todos'];
      }
      // Si "Todos" está activo, al clickear un tipo individual se mantienen todos pero se quita "Todos"
      // y se seleccionan los individuales excepto el clickeado
      if (list.includes('Todos')) {
        const sinTodos = this.TIPOS_PROCESO.filter(t => t !== 'Todos' && t !== tipo);
        return sinTodos.length ? sinTodos : [];
      }
      const idx = list.indexOf(tipo);
      if (idx > -1) {
        const next = [...list]; next.splice(idx, 1); return next;
      }
      return [...list, tipo];
    });
    this.etaErrTipoProceso.set(false);
  }

  guardarAgregarEtapa() {
    const errN = !this.formAgregarEtapa.nombre.trim();
    const errP = this.etaTiposProcesoSel().length === 0;
    const errE = !this.formAgregarEtapa.tipoEtapa;
    this.etaErrNombre.set(errN);
    this.etaErrTipoProceso.set(errP);
    this.etaErrTipoEtapa.set(errE);
    if (errN || errP || errE) return;
    const item: EtapaItem = {
      id: 'E' + String(this.etapasFormList().length + 1).padStart(3, '0'),
      nombre: this.formAgregarEtapa.nombre.trim(),
      tiposProceso: this.etaTiposProcesoSel(),
      tipoEtapa: this.formAgregarEtapa.tipoEtapa
    };
    this.etapasFormList.update(l => [...l, item]);
    this.closeModal();
  }

  eliminarEtapaItem(id: string) {
    this.etapasFormList.update(l => l.filter(e => e.id !== id));
  }

  addDurCriterio()             { this.etaDurCriterios.update(l => [...l, '']); }
  removeDurCriterio(i: number) { this.etaDurCriterios.update(l => l.filter((_, idx) => idx !== i)); }
  setDurCriterioTipo(i: number, tipo: string) {
    this.etaDurCriterios.update(l => { const n = [...l]; n[i] = tipo; return n; });
  }

  abrirModalDuracion(etapaId: string, tipoProceso: string) {
    const ex = this.etaDuraciones().find(d => d.etapaId === etapaId && d.tipoProceso === tipoProceso);
    this.etaDurEditEtapaId.set(etapaId);
    this.etaDurEditTipo.set(tipoProceso);
    this.formDuracion.set({
      diasCaso:   ex?.diasCaso   ?? 0,
      diasAlerta: ex?.diasAlerta ?? 0,
      diasMeta:   ex?.diasMeta   ?? 0,
      diasDEJ:    ex?.diasDEJ    ?? 0
    });
    this.openModal('duracion');
  }

  adjDur(field: keyof ReturnType<typeof this.formDuracion>, delta: number) {
    this.formDuracion.update(f => ({ ...f, [field]: Math.max(0, (f[field] as number) + delta) }));
  }

  guardarDuracion() {
    const item: DuracionItem = {
      etapaId:    this.etaDurEditEtapaId(),
      tipoProceso:this.etaDurEditTipo(),
      diasCaso:   this.formDuracion().diasCaso,
      diasAlerta: this.formDuracion().diasAlerta,
      diasMeta:   this.formDuracion().diasMeta,
      diasDEJ:    this.formDuracion().diasDEJ
    };
    this.etaDuraciones.update(list => {
      const idx = list.findIndex(d => d.etapaId === item.etapaId && d.tipoProceso === item.tipoProceso);
      if (idx > -1) { const n = [...list]; n[idx] = item; return n; }
      return [...list, item];
    });
    this.closeModal();
  }

  etapaNombrePorId(id: string): string {
    return this.etapasFormList().find(e => e.id === id)?.nombre ?? '';
  }

  // ── Sub-Etapas ────────────────────────────────────────────────────────────
  filtrarSubEtapas() {
    this.subSearchFil.set(this.fSubSearch);
    this.subEntidadFil.set(this.fSubEntidad);
    this.subEstadoFil.set(this.fSubEstado);
    this.subProcPage.set(1);
  }

  private resetSubForm() {
    this.subFormEntidad.set('Personas Naturales');
    this.subFormClientesSel.set(['Todos']);
    this.subFormClientesOpen.set(false);
    this.subFormEtapaId.set('');
  }

  nuevaConfigSubEtapa() {
    this.resetSubForm();
    this.formConfigSubEtapa = { estado: 'Activo' };
    this.subEstadosFormList.set([]);
    this.subProcEditId.set('');
    this.subFormPageSig.set(1);
    this.subProcView.set('form');
  }

  editarConfigSubEtapa(id: string) {
    const c = this.subetapasProc().find(x => x.id === id);
    if (!c) return;
    this.subFormEntidad.set(c.entidad);
    this.subFormClientesSel.set(c.clientes?.length ? c.clientes : ['Todos']);
    this.subFormClientesOpen.set(false);
    this.subFormEtapaId.set(c.etapaId);
    this.formConfigSubEtapa = { estado: c.estado };
    this.subEstadosFormList.set([...c.subestados]);
    this.subProcEditId.set(id);
    this.subFormPageSig.set(1);
    this.subProcView.set('form');
  }

  cancelarConfigSubEtapa() { this.subProcView.set('list'); }

  guardarConfigSubEtapa() {
    const etapa = this.etasPorEntidadCliente().find(e => e.id === this.subFormEtapaId());
    if (!etapa) { this.showToast('Selecciona una etapa'); return; }
    const record: ConfigSubEtapa = {
      id:          this.subProcEditId() || 'SE' + Date.now(),
      entidad:     this.subFormEntidad(),
      clientes:    this.subFormClientesSel(),
      etapaId:     etapa.id,
      etapaNombre: etapa.nombre,
      subestados:  this.subEstadosFormList(),
      estado:      this.formConfigSubEtapa.estado
    };
    if (this.subProcEditId()) {
      this.subetapasProc.update(l => l.map(c => c.id === record.id ? record : c));
    } else {
      this.subetapasProc.update(l => [...l, record]);
    }
    saveLS('sigcomt_subetapas_proc', this.subetapasProc());
    this.subProcView.set('list');
    this.showToast('Configuración guardada');
  }

  onSubEntidadChange() {
    this.subFormClientesSel.set(['Todos']);
    this.subFormEtapaId.set('');
  }

  toggleSubFormCliente(cliente: string) {
    this.subFormClientesSel.update(list => {
      if (cliente === 'Todos') return ['Todos'];
      const next = list.filter(c => c !== 'Todos');
      const idx = next.indexOf(cliente);
      if (idx > -1) next.splice(idx, 1); else next.push(cliente);
      return next.length ? [...next] : ['Todos'];
    });
    this.subFormEtapaId.set('');
  }

  abrirModalAgregarSubEstado() {
    this.formAgregarSubEstado = { nombre: '', descripcion: '', estado: 'Activo' };
    this.subErrNombre.set(false);
    this.openModal('agregarSubEstado');
  }

  guardarAgregarSubEstado() {
    const errN = !this.formAgregarSubEstado.nombre.trim();
    this.subErrNombre.set(errN);
    if (errN) return;
    const item: SubEstadoItem = {
      id: 'SS' + String(this.subEstadosFormList().length + 1).padStart(3, '0'),
      nombre:      this.formAgregarSubEstado.nombre.trim(),
      descripcion: this.formAgregarSubEstado.descripcion,
      estado:      this.formAgregarSubEstado.estado
    };
    this.subEstadosFormList.update(l => [...l, item]);
    this.closeModal();
  }

  eliminarSubEstadoItem(id: string) {
    this.subEstadosFormList.update(l => l.filter(s => s.id !== id));
  }

  // ── MODAL: Juzgado ────────────────────────────────────────────────────────
  juzgadoModalTitle = signal('Nuevo Juzgado');
  formJuzgado = { codigo: '', nombre: '', distrito: '', especialidad: '', estado: 'Activo' };
  fJuzSearch = ''; fJuzEstado = '';

  abrirModalJuzgado(codigo = '', nombre = '', distrito = '', especialidad = '') {
    this.juzgadoModalTitle.set(codigo ? 'Editar Juzgado' : 'Nuevo Juzgado');
    this.formJuzgado = { codigo, nombre, distrito, especialidad, estado: 'Activo' };
    this.openModal('juzgado');
  }

  guardarJuzgado() {
    if (!this.formJuzgado.nombre) { this.showToast('El nombre es obligatorio'); return; }
    this.closeModal(); this.showToast('Juzgado guardado');
  }

  filtrarJuzgados() { this.juzPage.set(1); }

  // ── MODAL: Tabla General ──────────────────────────────────────────────────
  tablaModalTitle = signal('Nueva Tabla');
  formTabla = { codigo: '', nombre: '', tipo: '', descripcion: '', estado: 'Activo' };
  fTabSearch = ''; fTabTipo = ''; fTabEstado = '';

  abrirModalTabla(codigo = '', nombre = '', tipo = '', descripcion = '') {
    this.tablaModalTitle.set(codigo ? 'Editar Tabla' : 'Nueva Tabla');
    this.formTabla = { codigo, nombre, tipo, descripcion, estado: 'Activo' };
    this.openModal('tabla');
  }

  guardarTabla() {
    if (!this.formTabla.nombre) { this.showToast('El nombre es obligatorio'); return; }
    this.closeModal(); this.showToast('Tabla guardada');
  }

  // ── MODAL: Tipo de Gasto ──────────────────────────────────────────────────
  editingGastoId: string | null = null;
  gastoModalTitle = signal('Nuevo Tipo de Gasto');
  showEstadoGasto = signal(false);
  formGasto = { codigo:'', nombre:'', descripcion:'', aplicativo:'GAP', tipo:'Administrativo', estado:'Activo' };

  abrirModalGasto() {
    this.editingGastoId = null; this.gastoModalTitle.set('Nuevo Tipo de Gasto'); this.showEstadoGasto.set(false);
    this.formGasto = { codigo:'', nombre:'', descripcion:'', aplicativo:'GAP', tipo:'Administrativo', estado:'Activo' };
    this.openModal('tipogasto');
  }

  editarGasto(id: string) {
    const g = this.tiposGasto().find(x => x.id === id); if (!g) return;
    this.editingGastoId = id; this.gastoModalTitle.set('Editar Tipo de Gasto'); this.showEstadoGasto.set(true);
    this.formGasto = { codigo:g.codigo, nombre:g.nombre, descripcion:g.descripcion, aplicativo:g.aplicativo, tipo:g.tipo??'Administrativo', estado:g.estado };
    this.openModal('tipogasto');
  }

  guardarGasto() {
    const f = this.formGasto;
    if (!f.codigo || !f.nombre) { this.showToast('Código y Nombre son obligatorios'); return; }
    const list = [...this.tiposGasto()];
    if (this.editingGastoId) {
      const idx = list.findIndex(g => g.id === this.editingGastoId);
      list[idx] = { ...list[idx], ...f };
    } else {
      if (list.find(g => g.codigo === f.codigo)) { this.showToast('El código ya está registrado'); return; }
      list.push({ id:'GAS'+String(list.length+1).padStart(3,'0'), ...f });
    }
    this.tiposGasto.set(list); saveLS('sigcomt_tipos_gasto', list);
    this.closeModal(); this.showToast(this.editingGastoId ? 'Tipo de gasto actualizado' : 'Tipo de gasto registrado');
  }

  filtrarGastos() {
    this.gastoPage.set(1);
    this.gastoSearch.set(this.fGastoSearch);
    this.gastoTipoFil.set(this.fGastoTipo);
    this.gastoEstadoFil.set(this.fGastoEstado);
  }

  // ── MODAL: Tipo de Arancel (SCG) ─────────────────────────────────────────
  editingArancelId: string | null = null;
  arancelModalTitle = signal('Nuevo Tipo de Arancel');
  showEstadoArancel = signal(false);
  formArancel = { codigo:'', tipoGasto:'', nombre:'', concepto:'', costo:0, estado:'Activo' };

  abrirModalArancel() {
    this.editingArancelId = null; this.arancelModalTitle.set('Nuevo Arancel'); this.showEstadoArancel.set(false);
    this.formArancel = { codigo:'', tipoGasto:'', nombre:'', concepto:'', costo:0, estado:'Activo' };
    this.openModal('tipoarancel');
  }

  editarArancel(id: string) {
    const a = this.tiposArancel().find(x => x.id === id); if (!a) return;
    this.editingArancelId = id; this.arancelModalTitle.set('Editar Arancel'); this.showEstadoArancel.set(true);
    this.formArancel = { codigo:a.codigo, tipoGasto:a.tipoGasto, nombre:a.nombre, concepto:a.concepto, costo:a.costo, estado:a.estado };
    this.openModal('tipoarancel');
  }

  guardarArancel() {
    const f = this.formArancel;
    if (!f.codigo || !f.nombre) { this.showToast('Código y Nombre son obligatorios'); return; }
    const list = [...this.tiposArancel()];
    if (this.editingArancelId) {
      const idx = list.findIndex(a => a.id === this.editingArancelId);
      list[idx] = { ...list[idx], ...f };
    } else {
      if (list.find(a => a.codigo === f.codigo)) { this.showToast('El código ya está registrado'); return; }
      list.push({ id:'ARC'+String(list.length+1).padStart(3,'0'), ...f });
    }
    this.tiposArancel.set(list); saveLS('sigcomt_tipos_arancel', list);
    this.closeModal(); this.showToast(this.editingArancelId ? 'Arancel actualizado' : 'Arancel registrado');
  }

  filtrarAranceles() {
    this.arancelPage.set(1);
    this.arancelSearch.set(this.fArancelSearch);
    this.arancelEstadoFil.set(this.fArancelEstado);
  }

  // ── MODAL: Tipo de Documento (GEPDIA) ─────────────────────────────────────
  editingDocId: string | null = null;
  docModalTitle = signal('Nuevo Tipo de Documento');
  showEstadoDoc = signal(false);
  formDoc = { codigo:'', nombre:'', descripcion:'', estado:'Activo' };

  abrirModalDoc() {
    this.editingDocId = null; this.docModalTitle.set('Nuevo Tipo de Documento'); this.showEstadoDoc.set(false);
    this.formDoc = { codigo:'', nombre:'', descripcion:'', estado:'Activo' };
    this.openModal('tipodocumento');
  }

  editarDoc(id: string) {
    const d = this.tiposDocumento().find(x => x.id === id); if (!d) return;
    this.editingDocId = id; this.docModalTitle.set('Editar Tipo de Documento'); this.showEstadoDoc.set(true);
    this.formDoc = { codigo:d.codigo, nombre:d.nombre, descripcion:d.descripcion, estado:d.estado };
    this.openModal('tipodocumento');
  }

  guardarDoc() {
    const f = this.formDoc;
    if (!f.codigo || !f.nombre) { this.showToast('Código y Nombre son obligatorios'); return; }
    const list = [...this.tiposDocumento()];
    if (this.editingDocId) {
      const idx = list.findIndex(d => d.id === this.editingDocId);
      list[idx] = { ...list[idx], ...f };
    } else {
      if (list.find(d => d.codigo === f.codigo)) { this.showToast('El código ya está registrado'); return; }
      list.push({ id:'DOC'+String(list.length+1).padStart(3,'0'), ...f });
    }
    this.tiposDocumento.set(list); saveLS('sigcomt_tipos_documento', list);
    this.closeModal(); this.showToast(this.editingDocId ? 'Tipo de documento actualizado' : 'Tipo de documento registrado');
  }

  filtrarDocumentos() {
    this.docPage.set(1);
    this.docSearch.set(this.fDocSearch);
    this.docEstadoFil.set(this.fDocEstado);
  }

  filtrarTablas() {
    this.tabPage.set(1);
    this.tabSearch.set(this.fTabSearch);
    this.tabTipoFil.set(this.fTabTipo);
    this.tabEstadoFil.set(this.fTabEstado);
  }
}
