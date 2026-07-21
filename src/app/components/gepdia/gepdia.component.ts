import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent, TopbarTab, TopbarNotificacion } from '../topbar/topbar.component';
import { PaginationComponent } from '../pagination/pagination.component';

/* ────────────────────────────────────────────────────────
   INTERFACES & DATOS LOCALES
──────────────────────────────────────────────────────── */
interface FaqItem { q: string; a: string; open: boolean; }
interface ConsultaGuardada { q: string; res: string; fecha: string; sources?: string[]; queryType?: string; }
interface ConsultaCompartida { q: string; res: string; fecha: string; sources?: string[]; queryType?: string; usuario: string; }
interface FormField { id: string; label: string; ph?: string; val?: string; type?: string; }
interface DocDef { label: string; subtitle: string; iconSvg: string; fields: FormField[]; }
interface FileItem { id: string; name: string; type: string; typeBadge: string; fecha: string; private: boolean; pages?: number; favorite?: boolean; inPapelera?: boolean; papeleraDate?: string; owner?: string; modificado?: string; estado?: 'Cargado' | 'Procesado'; sharedWith?: 'none' | 'all' | string[]; fileType?: 'PDF' | 'Word' | 'Excel' | 'Otro'; }
interface FolderItem { name: string; private: boolean; files: string[]; favorite?: boolean; inPapelera?: boolean; papeleraDate?: string; sharedWith?: 'none' | 'all' | string[]; fechaCreacion?: string; }
interface NotariaUser { id: string; name: string; role: string; }
interface PlantillaItem { id: string; notaria: string; nombre: string; tipo: string; tipoBadge: string; contexto: string; etiquetas: string[]; estado: 'Activo' | 'Inactivo'; }

type MenuKey = 'inicio' | 'procesamiento' | 'gendoc';
type SubProcKey = 'misdocs' | 'busqueda' | 'ia' | 'guardadas' | 'gestion';
type GenDocView = 'consulta' | 'formularios' | 'plantillas';
type DocType = 'autorizacion' | 'poder' | 'acta' | 'contrato' | 'declaracion' | 'renuncia';

/* ────────────────────────────────────────────────────────
   COMPONENT
──────────────────────────────────────────────────────── */
@Component({
  selector: 'app-gepdia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent, PaginationComponent],
  templateUrl: './gepdia.component.html',
  styleUrl: './gepdia.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GEPDIA implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  userName = computed(() => this.authService.obtenerNombreDisplay());
  private router = inject(Router);

  /* ── Topbar tabs ── */
  readonly topbarTabs: TopbarTab[] = [
    { key: 'inicio',          label: 'Inicio' },
    { key: 'procesamiento',   label: 'Procesamiento Inteligente' },
    { key: 'gendoc',          label: 'Generación de Documentos' },
  ];

  /* ── Notificaciones ── */
  notificaciones = signal<TopbarNotificacion[]>([
    {
      id: 1,
      tipo: 'compartido',
      titulo: 'Ana Torres compartió una carpeta',
      descripcion: 'La carpeta "Contratos Externos" ha sido compartida contigo.',
      tiempo: 'Hace 10 min',
      leida: false,
      accion: { vista: 'misdocs', folderName: 'Contratos Externos' },
    },
    {
      id: 2,
      tipo: 'compartido',
      titulo: 'Luis Mendoza compartió un documento',
      descripcion: '"Poder_Lima.pdf" ha sido compartido contigo.',
      tiempo: 'Hace 35 min',
      leida: false,
      accion: { vista: 'misdocs', folderName: 'Poderes Especiales' },
    },
    {
      id: 3,
      tipo: 'procesado',
      titulo: 'Documento procesado y listo',
      descripcion: '"Escritura_Publica_007.pdf" ya fue procesado y está listo para consultar con IA.',
      tiempo: 'Hace 1 h',
      leida: false,
      accion: { vista: 'misdocs', docName: 'Escritura_Publica_007.pdf' },
    },
    {
      id: 4,
      tipo: 'procesado',
      titulo: 'Documento procesado y listo',
      descripcion: '"Declaracion_Jurada_2026.pdf" ya fue procesado y está disponible.',
      tiempo: 'Hace 2 h',
      leida: true,
      accion: { vista: 'misdocs', docName: 'Declaracion_Jurada_2026.pdf' },
    },
  ]);

  /* ── Sidebar ── */
  sidebarExpanded = signal(true);

  /* ── Navegación principal ── */
  currentMenu = signal<MenuKey>('inicio');

  /* ── Sub-tab procesamiento ── */
  currentSubProc = signal<SubProcKey>('misdocs');

  /* ── Vista GenDoc ── */
  currentGenDocView = signal<GenDocView>('consulta');

  /* ── Modales ── */
  openModalId = signal<string | null>(null);

  /* ── Screen overlays ── */
  activeScreen = signal<string | null>(null);

  /* ── Toast ── */
  toastMsg = signal('');
  toastVisible = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  /* ── FAQ ── */
  faqs = signal<FaqItem[]>([
    { q: '¿Cuántos documentos puedo cargar por año?', a: 'Cada usuario tiene permitido cargar hasta 500 documentos por año. Un documento programado consume 1 carga; uno inmediato consume 5.', open: false },
    { q: '¿Cuántas consultas IA puedo realizar?', a: 'El límite es de 1,000 consultas por año por usuario. Cada consulta descuenta 1 del total disponible.', open: false },
    { q: '¿Qué formatos de documento acepta el sistema?', a: 'Solo se aceptan archivos PDF con un máximo de 20 MB y 100 páginas.', open: false },
    { q: '¿Cómo guardo el resultado de una consulta IA?', a: 'En la sección de resultados aparece el botón "Guardar". Las consultas guardadas se pueden revisar en "Consultas Guardadas".', open: false },
    { q: '¿Puedo buscar en un documento específico?', a: 'Sí. Desde "Mis Documentos" selecciona el documento y usa el botón IA para realizar la consulta solo en ese archivo.', open: false },
  ]);

  /* ── Recientes & Docs ── */
  tiposDocs = signal<string[]>(['Contratos', 'Poderes', 'Actas', 'Declaraciones', 'Autorizaciones', 'Renuncias', 'Otros']);

  /* ── Dashboard dates ── */
  dashDesde = signal('');
  dashHasta = signal('');

  /* ── Consulta IA ── */
  iaQuery = signal('');
  iaWordCount = signal(0);
  iaBtnText = signal('Generar respuesta');
  iaEmpty = signal(true);
  iaResultVisible = signal(false);
  iaBadgeVisible = signal(false);
  iaResultHtml = signal('');
  iaSourceFiles = signal<string[]>([]);
  iaQueryType = signal<'analisis' | 'puntual'>('puntual');
  iaConversation = signal<{ type: 'user' | 'bot'; text?: string; html?: string; queryType?: string; sources?: string[] }[]>([]);

  /* ── Consultas guardadas ── */
  consultasGuardadas = signal<ConsultaGuardada[]>([]);
  consultasTab = signal<'mis' | 'compartidas'>('mis');
  consultasCompartidas = signal<ConsultaCompartida[]>([
    {
      q: '¿Cuáles son las cláusulas principales del Contrato BCP?',
      res: 'El contrato BCP 2024 establece las siguientes cláusulas: vigencia hasta diciembre 2025, monto de S/ 120,000 y penalidad del 5% por incumplimiento.',
      fecha: '28/06/2026',
      queryType: 'analisis',
      sources: ['Contrato_BCP_2024.pdf'],
      usuario: 'Ana Torres',
    },
    {
      q: '¿Quién es el apoderado en el Poder Notarial López?',
      res: 'El apoderado designado es el Sr. López García, con facultades para representar ante entidades públicas y privadas.',
      fecha: '02/07/2026',
      queryType: 'puntual',
      sources: ['Poder_Notarial_López.pdf'],
      usuario: 'Luis Mendoza',
    },
    {
      q: '¿Cuál es la fecha de la Acta de Directorio?',
      res: 'El Acta de Reunión de Directorio fue celebrada el 22 de marzo de 2025 con quórum de 4 de 5 directores.',
      fecha: '05/07/2026',
      queryType: 'puntual',
      sources: ['Acta_Reunion_Directorio.pdf'],
      usuario: 'Carmen Ríos',
    },
  ]);

  /* ── Chat IA (gen docs) ── */
  chatMessages = signal<{ type: 'bot' | 'user'; html: string; docBtn?: { type: DocType; label: string } }[]>([
    { type: 'bot', html: '¡Hola! 👋 Cuéntame tu situación y te recomendaré el documento adecuado.' },
  ]);
  showInitSuggestions = signal(true);
  chatInput = signal('');

  /* ── Formulario dinámico ── */
  currentDoc = signal<DocType | null>(null);
  formTitle = signal('');
  formSubtitle = signal('');
  formIconSvg = signal('');
  formBreadcrumb = signal('Generación de Documentos');
  formFields = signal<FormField[]>([]);
  formValues: Record<string, string> = {};

  /* ── Preview ── */
  docLabel = signal('');
  docDate = signal('');
  docContentHtml = signal('');
  thumb1Text = signal('');

  /* ── Subida de archivos ── */
  docFilename = signal('');
  plantillaFilename = signal('');
  plantillaEditMode = signal(false);
  selectedDocFile: File | null = null;

  // Mis Documentos - UI state
  searchGlobal = signal('');
  folderName = signal('');
  folderUploadingFiles: File[] = [];
  newFolderPrivacy = signal<'privada' | 'publica'>('privada');
  misdocsTab = signal<'docs' | 'recientes' | 'favoritos' | 'papelera' | 'compartidos'>('recientes');

  // Contexto de consulta IA (carpeta o archivo específico seleccionado)
  iaContextFolder = signal<string | null>(null);
  iaContextFile   = signal<string | null>(null);
  iaScopeFilter   = signal<'all' | 'recientes'>('recientes');

  // Share modal state
  shareTargetFolder  = signal<string | null>(null);
  shareTargetFile    = signal<string | null>(null);
  shareMode          = signal<'none' | 'all' | 'users'>('none');
  shareUserSearch    = signal('');
  shareSelectedUsers = signal<string[]>([]);

  // Usuarios de la notaría (mock)
  notariaUsers = signal<NotariaUser[]>([
    { id: 'u1', name: 'Ana Torres',     role: 'Abogada Senior' },
    { id: 'u2', name: 'Luis Mendoza',   role: 'Abogado Junior' },
    { id: 'u3', name: 'Carmen Ríos',    role: 'Asistente Legal' },
    { id: 'u4', name: 'Jorge Castillo', role: 'Notario' },
  ]);

  shareUsersFiltered = computed(() =>
    this.notariaUsers().filter(u =>
      u.name.toLowerCase().includes(this.shareUserSearch().toLowerCase())
    )
  );

  // Compartidos conmigo (mock — datos que otros usuarios compartieron con el usuario actual)
  sharedFoldersWithMe = computed<(FolderItem & { sharedBy: string })[]>(() => [
    { name: 'Contratos Externos',  private: false, files: ['Acuerdo_Marco.pdf', 'Clausulas_Generales.pdf'], sharedBy: 'Ana Torres',   sharedWith: 'all', fechaCreacion: '03/03/2025' },
    { name: 'Poderes Especiales',  private: false, files: ['Poder_Lima.pdf', 'Poder_Cusco.docx'],           sharedBy: 'Luis Mendoza', sharedWith: 'all', fechaCreacion: '18/04/2025' },
    { name: 'Actas Societarias',   private: false, files: ['Acta_Junta_2025.pdf'],                          sharedBy: 'Carmen Ríos',  sharedWith: 'all', fechaCreacion: '22/05/2025' },
  ]);

  sharedFilesWithMe = computed<(FileItem & { sharedBy: string })[]>(() => [
    { id: 'sh1', name: 'Acuerdo_Marco.pdf',       type: 'Contrato', typeBadge: 'b-blue',   fecha: '10/05/2025', private: false, estado: 'Procesado', sharedBy: 'Ana Torres',   fileType: 'PDF',   pages: 4 },
    { id: 'sh2', name: 'Clausulas_Generales.pdf', type: 'Contrato', typeBadge: 'b-blue',   fecha: '10/05/2025', private: false, estado: 'Procesado', sharedBy: 'Ana Torres',   fileType: 'PDF',   pages: 2 },
    { id: 'sh3', name: 'Poder_Lima.pdf',          type: 'Poder',    typeBadge: 'b-orange', fecha: '18/04/2025', private: false, estado: 'Procesado', sharedBy: 'Luis Mendoza', fileType: 'PDF',   pages: 3 },
    { id: 'sh4', name: 'Poder_Cusco.docx',        type: 'Poder',    typeBadge: 'b-orange', fecha: '18/04/2025', private: false, estado: 'Cargado',   sharedBy: 'Luis Mendoza', fileType: 'Word',  pages: 2 },
    { id: 'sh5', name: 'Acta_Junta_2025.pdf',     type: 'Acta',     typeBadge: 'b-gray',   fecha: '22/05/2025', private: false, estado: 'Procesado', sharedBy: 'Carmen Ríos',  fileType: 'PDF',   pages: 6 },
  ]);
  misdocsView = signal<'grid' | 'list'>('grid');
  saveAsMode = signal<'same' | 'new'>('same');
  viewDocMode = signal<'full' | 'basic'>('full');
  editPagesList = signal<number[]>([]);
  pagesReordered = signal(false);
  private originalPageOrder: number[] = [];
  draggedPageIdx: number | null = null;
  dragOverPageIdx: number | null = null;
  newDocName        = signal('');
  newDocDescription = signal('');
  newDocPrivacy     = signal<'privado' | 'publico'>('privado');
  newDocFolder      = signal('');
  newDocDragOver    = signal(false);
  procesarTipoCarga = signal<'inmediata' | 'programado'>('programado');
  folders = signal<FolderItem[]>([
    { name: 'Contratos 2024', private: true,  files: ['Contrato_BCP_2024.pdf', 'Acta_Reunion_Directorio.pdf'], favorite: true,  sharedWith: 'none',        fechaCreacion: '01/01/2024' },
    { name: 'Poderes',        private: false, files: ['Poder_Notarial_López.pdf'],                             favorite: false, sharedWith: ['u1', 'u2'],  fechaCreacion: '15/03/2024' },
  ]);

  // Search state for Mis Documentos (matches Busqueda UI)
  searchDesde = signal('');
  searchHasta = signal('');
  currentFolder = signal<string | null>(null);

  isCurrentFolderShared = computed(() =>
    this.sharedFoldersWithMe().some(f => f.name === this.currentFolder())
  );

  reorderFileId    = signal<string | null>(null);
  reorderPageOrder = signal<number[]>([]);
  trashTargetFileId = signal<string | null>(null);

  // File table state & modals
  files = signal<FileItem[]>([
    { id: '1', name: 'Contrato_BCP_2024.pdf',        type: 'Contrato', typeBadge: 'b-blue',   fecha: '12/01/2025', private: true,  pages: 3, modificado: '05/06/2026', estado: 'Procesado', sharedWith: 'none', fileType: 'PDF'   },
    { id: '2', name: 'Poder_Notarial_López.pdf',     type: 'Poder',    typeBadge: 'b-orange', fecha: '08/03/2025', private: false, pages: 2, modificado: '02/06/2026', owner: 'Ana Torres', estado: 'Cargado',   sharedWith: 'none', fileType: 'PDF'  },
    { id: '3', name: 'Acta_Reunion_Directorio.pdf',  type: 'Acta',     typeBadge: 'b-gray',   fecha: '22/03/2025', private: true,  pages: 4, modificado: '01/06/2026', estado: 'Procesado', sharedWith: 'none', fileType: 'Word'  },
    { id: '4', name: 'Escritura_Publica_007.pdf',    type: 'Escritura',typeBadge: 'b-blue',   fecha: '01/07/2026', private: true,  pages: 5, modificado: '01/07/2026', estado: 'Procesado', sharedWith: 'none', fileType: 'PDF'   },
    { id: '5', name: 'Declaracion_Jurada_2026.pdf',  type: 'Declaración',typeBadge:'b-green',  fecha: '04/07/2026', private: false, pages: 2, modificado: '04/07/2026', estado: 'Cargado',   sharedWith: 'all',  fileType: 'PDF'   },
    { id: '6', name: 'Aprobacion_Credito_BCP.pdf',   type: 'Autorización', typeBadge: 'b-blue', fecha: '15/06/2026', private: true, pages: 2, modificado: '15/06/2026', estado: 'Procesado', sharedWith: 'none', fileType: 'PDF' },
    { id: '7', name: 'Poder_Especial_Cobro.docx',    type: 'Poder', typeBadge: 'b-orange', fecha: '20/06/2026', private: false, pages: 3, modificado: '20/06/2026', estado: 'Cargado', sharedWith: 'none', fileType: 'Word' },
    { id: '8', name: 'Acuerdo_Extrajudicial.pdf',    type: 'Acuerdo', typeBadge: 'b-gray', fecha: '25/06/2026', private: true, pages: 4, modificado: '25/06/2026', estado: 'Procesado', sharedWith: 'none', fileType: 'PDF' },
    { id: '9', name: 'Certificado_Solteria.pdf',     type: 'Certificado', typeBadge: 'b-green', fecha: '28/06/2026', private: false, pages: 1, modificado: '28/06/2026', estado: 'Cargado', sharedWith: 'none', fileType: 'PDF' },
    { id: '10', name: 'Resolucion_Directorio.xlsx',  type: 'Resolución', typeBadge: 'b-blue', fecha: '02/07/2026', private: true, pages: 2, modificado: '02/07/2026', estado: 'Procesado', sharedWith: 'none', fileType: 'Excel' },
    { id: '11', name: 'Minuta_Constitutiva.pdf',     type: 'Minuta', typeBadge: 'b-orange', fecha: '03/07/2026', private: false, pages: 5, modificado: '03/07/2026', estado: 'Cargado', sharedWith: 'none', fileType: 'PDF' },
  ]);

  docsRecientes = computed<FileItem[]>(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return this.files().filter(f => {
      if (f.inPapelera) return false;
      const [d, m, y] = f.fecha.split('/').map(Number);
      return new Date(y, m - 1, d) >= cutoff;
    });
  });
  selectedFiles = signal<Set<string>>(new Set());
  gestionSelectedFiles = signal<Set<string>>(new Set());
  gestionSearchFilter = signal('');
  gestionDateFilter = signal('');
  currentViewFile = signal<FileItem | null>(null);
  selectedPage = signal(1);
  gestionCurrentPage = signal(1);
  readonly gestionItemsPerPage = 5;

  plantillas = signal<PlantillaItem[]>([
    { id: '1', notaria: 'Lima Centro', nombre: 'Autorización para cobro', tipo: 'Autorización', tipoBadge: 'b-blue', contexto: 'Plantilla para autorizar cobro de cheques y depósitos', etiquetas: ['banco', 'cobro'], estado: 'Activo' },
    { id: '2', notaria: 'Miraflores', nombre: 'Carta Poder General', tipo: 'Poder', tipoBadge: 'b-orange', contexto: 'Poder amplio para representación legal general', etiquetas: ['legal', 'representación'], estado: 'Activo' },
    { id: '3', notaria: 'San Isidro', nombre: 'Declaración Jurada Simple', tipo: 'Declaración', tipoBadge: 'b-gray', contexto: 'Plantilla de declaración jurada de domicilio y bienes', etiquetas: ['jurado', 'domicilio'], estado: 'Inactivo' },
    { id: '4', notaria: 'Lima Centro', nombre: 'Poder Especial de Cobro', tipo: 'Poder', tipoBadge: 'b-orange', contexto: 'Poder limitado para cobro de cheques específicos', etiquetas: ['poder', 'cheques', 'cobro'], estado: 'Activo' },
    { id: '5', notaria: 'Miraflores', nombre: 'Acuerdo Extrajudicial', tipo: 'Acuerdo', tipoBadge: 'b-green', contexto: 'Plantilla para acuerdos extrajudiciales entre partes', etiquetas: ['acuerdo', 'legal'], estado: 'Activo' },
    { id: '6', notaria: 'San Isidro', nombre: 'Certificado de Domicilio', tipo: 'Certificado', tipoBadge: 'b-blue', contexto: 'Certificado de domicilio para trámites administrativos', etiquetas: ['domicilio', 'certificado'], estado: 'Activo' },
    { id: '7', notaria: 'Lima Centro', nombre: 'Minuta de Constitución', tipo: 'Minuta', tipoBadge: 'b-purple', contexto: 'Plantilla para minuta de constitución de sociedades', etiquetas: ['sociedad', 'constitución'], estado: 'Activo' },
    { id: '8', notaria: 'Miraflores', nombre: 'Escritura de Propiedad', tipo: 'Escritura', tipoBadge: 'b-red', contexto: 'Plantilla para transferencia de propiedad inmueble', etiquetas: ['propiedad', 'inmueble'], estado: 'Activo' },
  ]);
  plantillaCurrentPage = signal(1);
  readonly plantillaItemsPerPage = 5;

  // Modal form states
  saveName = signal('');
  saveFolderName = signal('');
  saveAsPrivate = signal(true);
  emailFrom = signal('usuario@notaria.com');
  emailTo = signal('');
  emailSubject = signal('');
  emailMessage = signal('');
  moveAction = signal<'move' | 'copy'>('move');
  moveTargetFolder = signal('');
  newFolderNameMove = signal('');


  applyGlobalSearch(): void {
    // open the Busqueda view with current search filters
    this.currentFolder.set(null);
    this.currentSubProc.set('busqueda');
    this.showToast('Filtro aplicado');
  }

  openFolder(name: string): void {
    this.currentFolder.set(name);
    this.selectedFiles.set(new Set());
    this.currentSubProc.set('misdocs');
  }

  closeFolder(): void {
    this.currentFolder.set(null);
    this.selectedFiles.set(new Set());
  }

  abrirCarpetaDeDoc(docName: string): void {
    const folder = this.folders().find(f => f.files.includes(docName) && !f.inPapelera);
    if (folder) {
      this.openFolder(folder.name);
    } else {
      this.showToast('Este documento no está en ninguna carpeta');
    }
  }

  getFilesForFolder(folderName: string): FileItem[] {
    const folder = this.folders().find(f => f.name === folderName);
    if (folder) return this.files().filter(f => folder.files.includes(f.name) && !f.inPapelera);
    const shared = this.sharedFoldersWithMe().find(f => f.name === folderName);
    if (shared) return this.sharedFilesWithMe().filter(f => shared.files.includes(f.name));
    return [];
  }

  toggleCheckAllFolder(event: Event, folderName: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedFiles.set(new Set(this.getFilesForFolder(folderName).map(f => f.id)));
    } else {
      this.selectedFiles.set(new Set());
    }
  }

  /* ──────── File Management Methods ──────── */
  
  getVisibleFiles(): FileItem[] {
    return this.files().filter(f => {
      const search = this.searchGlobal().toLowerCase();
      const matchSearch = !search || f.name.toLowerCase().includes(search);
      return matchSearch;
    });
  }

  toggleFile(id: string): void {
    const sel = new Set(this.selectedFiles());
    if (sel.has(id)) {
      sel.delete(id);
    } else {
      sel.add(id);
    }
    this.selectedFiles.set(sel);
  }

  toggleCheckAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const visibleIds = this.getVisibleFiles().map(f => f.id);
    if (checked) {
      this.selectedFiles.set(new Set(visibleIds));
    } else {
      this.selectedFiles.set(new Set());
    }
  }

  isAllPrivate(): boolean {
    const selected = Array.from(this.selectedFiles()).map(id => 
      this.files().find(f => f.id === id)
    ).filter(Boolean) as FileItem[];
    return selected.length > 0 && selected.every(f => f.private);
  }

  togglePrivacy(): void {
    const selected = Array.from(this.selectedFiles());
    const allPrivate = this.isAllPrivate();
    const updated = this.files().map(f => 
      selected.includes(f.id) ? { ...f, private: !allPrivate } : f
    );
    this.files.set(updated);
    this.showToast(allPrivate ? 'Documentos ahora públicos' : 'Documentos ahora privados');
  }

  openViewModal(file: FileItem): void {
    this.currentViewFile.set(file);
    this.saveName.set(file.name);
    this.saveAsMode.set('same');
    this.viewDocMode.set('full');
    const pages = Array.from({ length: file.pages ?? 3 }, (_, i) => i + 1);
    this.editPagesList.set(pages);
    this.originalPageOrder = [...pages];
    this.pagesReordered.set(false);
    this.emailSubject.set(`Documento: ${file.name}`);
    this.emailMessage.set('Estimado/a,\n\nAdjunto encontrará el documento solicitado.\n\nQuedo a su disposición para cualquier consulta.');
    this.openModal('modal-view-doc');
  }

  openViewModalGuardada(c: ConsultaGuardada, index: number): void {
    const synthetic: FileItem = {
      id: `guardada-${index}`,
      name: `Consulta_IA_${c.fecha.replace(/\//g, '-')}.pdf`,
      type: 'Consulta IA',
      typeBadge: 'b-blue',
      fecha: c.fecha,
      private: false,
      pages: 1,
    };
    this.currentViewFile.set(synthetic);
    this.saveName.set(synthetic.name);
    this.saveAsMode.set('same');
    this.viewDocMode.set('full');
    this.editPagesList.set([1]);
    this.originalPageOrder = [1];
    this.pagesReordered.set(false);
    this.emailSubject.set(`Consulta IA: ${c.q.slice(0, 60)}`);
    this.emailMessage.set('Estimado/a,\n\nAdjunto encontrará el resultado de la consulta IA solicitada.\n\nQuedo a su disposición para cualquier consulta.');
    this.openModal('modal-view-doc');
  }

  openViewModalBasic(file: FileItem): void {
    this.currentViewFile.set(file);
    this.saveName.set(file.name);
    this.saveAsMode.set('same');
    this.viewDocMode.set('basic');
    const pagesBasic = Array.from({ length: file.pages ?? 3 }, (_, i) => i + 1);
    this.editPagesList.set(pagesBasic);
    this.originalPageOrder = [...pagesBasic];
    this.pagesReordered.set(false);
    this.openModal('modal-view-doc');
  }

  onPageDragStart(idx: number): void {
    this.draggedPageIdx = idx;
  }

  onPageDragOver(event: DragEvent, idx: number): void {
    event.preventDefault();
    this.dragOverPageIdx = idx;
  }

  onPageDrop(idx: number): void {
    if (this.draggedPageIdx === null || this.draggedPageIdx === idx) {
      this.draggedPageIdx = null;
      this.dragOverPageIdx = null;
      return;
    }
    const pages = [...this.editPagesList()];
    const [moved] = pages.splice(this.draggedPageIdx, 1);
    pages.splice(idx, 0, moved);
    this.editPagesList.set(pages);
    this.pagesReordered.set(pages.some((p, i) => p !== this.originalPageOrder[i]));
    this.draggedPageIdx = null;
    this.dragOverPageIdx = null;
  }

  onPageDragEnd(): void {
    this.draggedPageIdx = null;
    this.dragOverPageIdx = null;
  }

  isDragOver(idx: number): boolean {
    return this.dragOverPageIdx === idx;
  }

  isDragging(idx: number): boolean {
    return this.draggedPageIdx === idx;
  }

  procesarDocumentos(): void {
    this.closeModal();
    this.gestionSelectedFiles.set(new Set());
    this.showToast('Documentos enviados a procesar');
  }

  docsParaProcesar(): FileItem[] {
    return this.files().filter(f => !f.inPapelera);
  }

  gestionFilteredDocs(): FileItem[] {
    return this.files().filter(f => {
      if (f.inPapelera) return false;
      // Solo mostrar documentos que no tengan owner (propios) o cuyo owner sea el usuario actual
      if (f.owner && f.owner !== 'Ana Torres') return false;
      const search = this.gestionSearchFilter().toLowerCase();
      if (search && !f.name.toLowerCase().includes(search)) return false;
      if (this.gestionDateFilter()) {
        const parts = f.fecha.split('/');
        if (parts.length === 3 && `${parts[2]}-${parts[1]}-${parts[0]}` !== this.gestionDateFilter()) return false;
      }
      return true;
    });
  }

  gestionPaginatedDocs(): FileItem[] {
    const filtered = this.gestionFilteredDocs();
    const start = (this.gestionCurrentPage() - 1) * this.gestionItemsPerPage;
    const end = start + this.gestionItemsPerPage;
    return filtered.slice(start, end);
  }

  gestionTotalPages(): number {
    return Math.ceil(this.gestionFilteredDocs().length / this.gestionItemsPerPage);
  }

  gestionPageNumbers(): number[] {
    const totalPages = this.gestionTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  gestionGoToPage(page: number): void {
    const totalPages = this.gestionTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.gestionCurrentPage.set(page);
    }
  }

  plantillaPaginatedItems(): PlantillaItem[] {
    const filtered = this.plantillas();
    const start = (this.plantillaCurrentPage() - 1) * this.plantillaItemsPerPage;
    const end = start + this.plantillaItemsPerPage;
    return filtered.slice(start, end);
  }

  plantillaTotalPages(): number {
    return Math.ceil(this.plantillas().length / this.plantillaItemsPerPage);
  }

  plantillaGoToPage(page: number): void {
    const totalPages = this.plantillaTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.plantillaCurrentPage.set(page);
    }
  }

  isGestionSelected(id: string): boolean {
    return this.gestionSelectedFiles().has(id);
  }

  toggleGestionFile(id: string): void {
    const sel = new Set(this.gestionSelectedFiles());
    if (sel.has(id)) sel.delete(id); else sel.add(id);
    this.gestionSelectedFiles.set(sel);
  }

  toggleCheckAllGestion(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.gestionSelectedFiles.set(
      checked ? new Set(this.gestionFilteredDocs().map(f => f.id)) : new Set()
    );
  }

  isAllGestionChecked(): boolean {
    const docs = this.gestionFilteredDocs();
    return docs.length > 0 && docs.every(f => this.gestionSelectedFiles().has(f.id));
  }

  docsAProcesor(): FileItem[] {
    const sel = this.gestionSelectedFiles();
    if (sel.size > 0) return this.gestionFilteredDocs().filter(f => sel.has(f.id));
    return this.gestionFilteredDocs();
  }

  downloadFile(file: FileItem | null): void {
    if (!file) return;
    this.showToast(`Descargando ${file.name}...`);
  }

  saveEditedPages(): void {
    this.saveAsMode.set('same');
    this.saveName.set(this.currentViewFile()?.name ?? '');
    this.openModal('modal-save-pages');
  }

  confirmSavePages(): void {
    if (this.saveAsMode() === 'new' && !this.saveName()) {
      this.showToast('Por favor ingresa un nombre');
      return;
    }
    this.pagesReordered.set(false);
    this.originalPageOrder = [...this.editPagesList()];
    this.closeModal();
    const name = this.saveAsMode() === 'new' ? this.saveName() : (this.currentViewFile()?.name ?? 'documento');
    this.showToast(`Orden guardado: ${name}`);
  }

  selectPage(page: number): void {
    this.selectedPage.set(page);
  }

  saveDocumentAs(): void {
    if (!this.saveName()) {
      this.showToast('Por favor ingresa un nombre');
      return;
    }
    this.closeModal();
    this.showToast(`Documento guardado como ${this.saveName()}`);
  }

  sendEmail(): void {
    if (!this.emailTo()) {
      this.showToast('Por favor ingresa email destinatario');
      return;
    }
    this.closeModal();
    this.showToast(`Email enviado a ${this.emailTo()}`);
  }

  performMoveOrCopy(): void {
    if (!this.moveTargetFolder() && !this.newFolderNameMove()) {
      this.showToast('Selecciona carpeta destino');
      return;
    }
    this.closeModal();
    this.selectedFiles.set(new Set());
    const action = this.moveAction() === 'move' ? 'movidos' : 'copiados';
    this.showToast(`${this.selectedFiles().size} archivo(s) ${action}`);
  }

  /* ────── Sidebar map (navegación) ────── */
  readonly sidebarMap: Record<MenuKey, { label: string; icon: string; cb: string }[]> = {
    inicio: [
      { label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', cb: 'inicio' },
      { label: 'Preguntas Frecuentes', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', cb: 'faq' },
    ],
    procesamiento: [
      { label: 'Consulta IA', icon: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14a8 8 0 01-5.657-2.343A6 6 0 0118 16a6 6 0 01-5.999-5.999A3.001 3.001 0 0012 16z', cb: 'ia' },
      { label: 'Mis documentos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z', cb: 'misdocs' },
      { label: 'Consultas Guardadas', icon: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z', cb: 'guardadas' },
      { label: 'Gestión de Documentos', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', cb: 'gestion' },
    ],
    gendoc: [
      { label: 'Consulta de Formularios', icon: 'M8 9h8M8 13h6M5 3h14a2 2 0 012 2v14l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2z', cb: 'consulta' },
      { label: 'Formularios', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z', cb: 'formularios' },
      { label: 'Gestión de Plantillas', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', cb: 'plantillas' },
    ],
  };

  activeSidebarCb = signal('inicio');

  /* ── Doc definitions ── */
  readonly DOCS: Record<DocType, DocDef> = {
    autorizacion: {
      label: 'Autorización', subtitle: 'Permite a otra persona actuar en tu nombre',
      iconSvg: '<svg width="18" height="18" fill="none" stroke="var(--orange)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
      fields: [
        { id: 'nombres', label: 'Nombres del autorizante', ph: 'Mario Uribe Reyes', val: 'Mario Uribe Reyes' },
        { id: 'dni', label: 'DNI', ph: '71665423', val: '71665423' },
        { id: 'autorizado', label: 'Nombre del autorizado', ph: 'Ana García López' },
        { id: 'dni_autorizado', label: 'DNI del autorizado', ph: '45678901' },
        { id: 'tramite', label: 'Trámite a realizar', ph: 'Cobro de cheque en Banco de la Nación' },
        { id: 'fecha', label: 'Fecha límite', type: 'date' },
        { id: 'direccion', label: 'Dirección', ph: 'Calle Tulipanes 234, Lima', val: 'Calle Tulipanes 234' },
      ],
    },
    poder: {
      label: 'Carta Poder', subtitle: 'Autoriza a otra persona a representarte',
      iconSvg: '<svg width="18" height="18" fill="none" stroke="var(--orange)" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3 6.5L22 9.3l-5 4.9 1.2 6.8L12 18l-6.2 3 1.2-6.8L2 9.3l7-.8z"/></svg>',
      fields: [
        { id: 'poderdante', label: 'Nombres del poderdante', ph: 'Mario Uribe Reyes', val: 'Mario Uribe Reyes' },
        { id: 'dni', label: 'DNI', ph: '71665423', val: '71665423' },
        { id: 'apoderado', label: 'Nombre del apoderado', ph: 'Carlos Uribe Reyes' },
        { id: 'dni_apoderado', label: 'DNI del apoderado', ph: '48231567' },
        { id: 'facultades', label: 'Facultades otorgadas', ph: 'Realizar trámites bancarios...', type: 'textarea' },
        { id: 'direccion', label: 'Dirección', ph: 'Calle Tulipanes 234, Lima', val: 'Calle Tulipanes 234' },
      ],
    },
    acta: {
      label: 'Acta', subtitle: 'Registra acuerdos o hechos formalmente',
      iconSvg: '<svg width="18" height="18" fill="none" stroke="var(--orange)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
      fields: [
        { id: 'tipo_acta', label: 'Tipo de acta', ph: 'Acta de reunión' },
        { id: 'lugar', label: 'Lugar', ph: 'Sala de reuniones, Lima' },
        { id: 'fecha', label: 'Fecha', type: 'date' },
        { id: 'presentes', label: 'Personas presentes', ph: 'Mario Uribe, Ana García...', val: 'Mario Uribe Reyes', type: 'textarea' },
        { id: 'asunto', label: 'Asunto', ph: 'Acuerdo de trabajo' },
        { id: 'descripcion', label: 'Descripción', ph: 'Detalla los acuerdos...', type: 'textarea' },
      ],
    },
    contrato: {
      label: 'Contrato', subtitle: 'Acuerdo legal entre dos o más partes',
      iconSvg: '<svg width="18" height="18" fill="none" stroke="var(--orange)" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>',
      fields: [
        { id: 'tipo_contrato', label: 'Tipo de contrato', ph: 'Prestación de servicios' },
        { id: 'parte_a', label: 'Nombre Parte A', ph: 'Mario Uribe Reyes', val: 'Mario Uribe Reyes' },
        { id: 'dni_a', label: 'DNI Parte A', ph: '71665423', val: '71665423' },
        { id: 'parte_b', label: 'Nombre Parte B', ph: 'Empresa contratada' },
        { id: 'objeto', label: 'Objeto del contrato', ph: 'Descripción del servicio...', type: 'textarea' },
        { id: 'monto', label: 'Monto', ph: 'S/ 2,500.00' },
        { id: 'duracion', label: 'Duración', ph: '6 meses' },
        { id: 'direccion', label: 'Dirección', ph: 'Calle Tulipanes 234, Lima', val: 'Calle Tulipanes 234' },
      ],
    },
    declaracion: {
      label: 'Declaración Jurada', subtitle: 'Declara hechos o situaciones formalmente',
      iconSvg: '<svg width="18" height="18" fill="none" stroke="var(--orange)" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
      fields: [
        { id: 'nombres', label: 'Nombres completos', ph: 'Mario Uribe Reyes', val: 'Mario Uribe Reyes' },
        { id: 'dni', label: 'DNI', ph: '71665423', val: '71665423' },
        { id: 'direccion', label: 'Domicilio', ph: 'Calle Tulipanes 234, Lima', val: 'Calle Tulipanes 234' },
        { id: 'declaracion', label: 'Declaro que...', ph: 'Describe los hechos bajo juramento...', type: 'textarea' },
      ],
    },
    renuncia: {
      label: 'Carta de Renuncia', subtitle: 'Comunicación formal de renuncia voluntaria',
      iconSvg: '<svg width="18" height="18" fill="none" stroke="var(--orange)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="15" x2="15" y2="9"/><line x1="15" y1="15" x2="9" y2="9"/></svg>',
      fields: [
        { id: 'nombres', label: 'Tu nombre completo', ph: 'Mario Uribe Reyes', val: 'Mario Uribe Reyes' },
        { id: 'dni', label: 'DNI', ph: '71665423', val: '71665423' },
        { id: 'cargo', label: 'Cargo', ph: 'Asistente Legal' },
        { id: 'empresa', label: 'Empresa', ph: 'SIGCOMT Abogados' },
        { id: 'jefe', label: 'Dirigido a', ph: 'Gerencia General', val: 'Gerencia General' },
        { id: 'motivo', label: 'Motivo (opcional)', ph: 'Motivos personales...' },
        { id: 'fecha_efectiva', label: 'Fecha efectiva', type: 'date' },
      ],
    },
  };

  readonly docTypes: DocType[] = ['autorizacion', 'poder', 'acta', 'contrato', 'declaracion', 'renuncia'];

  readonly DOC_MAP: Record<string, DocType> = {
    'papá no puede': 'autorizacion', 'no puede asistir': 'autorizacion', 'asistir': 'autorizacion',
    'renunciar': 'renuncia', 'renuncio': 'renuncia', 'renuncia': 'renuncia',
    'contrato': 'contrato', 'contratar': 'contrato',
    'bienes': 'declaracion', 'declarar': 'declaracion',
    'poder': 'poder', 'apoderado': 'poder',
    'acta': 'acta', 'reunión': 'acta',
  };

  readonly IA_RESP: Record<string, string> = {
    contrato: 'Se encontraron <strong>3 contratos vigentes</strong>:<br>• Contrato N° 2024-001 — Vence <strong>15/12/2024</strong><br>• Contrato N° 2024-008 — Vence <strong>28/02/2025</strong><br>• Contrato N° 2024-015 — Vence <strong>31/03/2025</strong>',
    vencimiento: 'Se identificaron <strong>5 documentos próximos a vencer</strong> en los próximos 30 días.',
    poder: 'Se encontraron <strong>2 poderes activos</strong> relacionados con representación legal general.',
  };

  /* ════════════════════════════════════
     LIFECYCLE
  ════════════════════════════════════ */
  ngOnInit(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    this.dashDesde.set(fmt(firstDay));
    this.dashHasta.set(fmt(today));

    this.goMenu('inicio');
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  /* ════════════════════════════════════
     NAVEGACIÓN
  ════════════════════════════════════ */
  goMenu(menu: string): void {
    this.currentMenu.set(menu as MenuKey);
    this.activeSidebarCb.set(this.sidebarMap[menu as MenuKey][0]?.cb ?? menu);

    if (menu === 'gendoc') {
      this.currentGenDocView.set('consulta');
    }
    if (menu === 'procesamiento') {
      this.currentSubProc.set('ia');
      this.currentFolder.set(null);
    }
  }

  sdiClick(cb: string): void {
    this.activeSidebarCb.set(cb);
    const menu = this.currentMenu();

    if (menu === 'procesamiento') {
      if (cb !== 'misdocs') this.currentFolder.set(null);
      this.currentSubProc.set(cb as SubProcKey);
    } else if (menu === 'gendoc') {
      this.currentGenDocView.set(cb as GenDocView);
    } else if (menu === 'inicio') {
      if (cb === 'faq') {
        setTimeout(() => {
          const faqEl = document.getElementById('faq-section');
          const mainEl = document.getElementById('main-content');
          if (faqEl && mainEl) mainEl.scrollTo({ top: faqEl.offsetTop - 20, behavior: 'smooth' });
        }, 50);
      } else {
        setTimeout(() => {
          const mainEl = document.getElementById('main-content');
          if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarExpanded.set(!this.sidebarExpanded());
  }

  closeDropdown(): void { }

  handleLogout(): void {
    this.authService.logout();
  }

  handleNotifClick(n: TopbarNotificacion): void {
    this.notificaciones.update(list =>
      list.map(x => x.id === n.id ? { ...x, leida: true } : x)
    );
    if (!n.accion) return;
    this.goMenu('procesamiento');
    this.sdiClick('misdocs');
    if (n.tipo === 'compartido') {
      this.misdocsTab.set('compartidos');
      if (n.accion.folderName) this.openFolder(n.accion.folderName);
    } else if (n.tipo === 'procesado') {
      this.misdocsTab.set('recientes');
    }
  }

  clearNotificaciones(): void {
    this.notificaciones.set([]);
  }

  marcarTodasLeidasNotifs(): void {
    this.notificaciones.update(list => list.map(n => ({ ...n, leida: true })));
  }

  /* ════════════════════════════════════
     MODALES
  ════════════════════════════════════ */
  openModal(id: string): void {
    this.openModalId.set(id);
  }

  closeModal(): void {
    this.openModalId.set(null);
  }

  isModalOpen(id: string): boolean {
    return this.openModalId() === id;
  }

  // Folder modal handlers
  onFolderFilesChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    this.folderUploadingFiles = Array.from(input.files);
  }

  createFolder(): void {
    const name = (this.folderName() || '').trim();
    if (!name) { this.showToast('Ingresa un nombre de carpeta'); return; }
    const files = this.folderUploadingFiles.map(f => f.name);
    const isPrivate = this.newFolderPrivacy() === 'privada';
    this.folders.set([...this.folders(), { name, private: isPrivate, files }]);
    this.folderName.set('');
    this.newFolderPrivacy.set('privada');
    this.folderUploadingFiles = [];
    this.closeModal();
    this.showToast(`Carpeta "${name}" creada`);
  }

  /* ════════════════════════════════════
     SCREEN OVERLAYS
  ════════════════════════════════════ */
  showScreen(id: string): void {
    this.activeScreen.set(id);
  }

  closeForm(): void {
    this.activeScreen.set(null);
  }

  /* ════════════════════════════════════
     TOAST
  ════════════════════════════════════ */
  showToast(msg: string): void {
    this.toastMsg.set('✓ ' + msg);
    this.toastVisible.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 3000);
  }

  /* ════════════════════════════════════
     FAQ
  ════════════════════════════════════ */
  toggleFAQ(index: number): void {
    const list = [...this.faqs()];
    list[index] = { ...list[index], open: !list[index].open };
    this.faqs.set(list);
  }

  /* ════════════════════════════════════
     DASHBOARD
  ════════════════════════════════════ */
  recargarDash(): void {
    this.showToast('Dashboard actualizado');
  }

  /* ════════════════════════════════════
     CONSULTA IA
  ════════════════════════════════════ */
  onIaQueryInput(value: string): void {
    this.iaQuery.set(value);
    this.iaWordCount.set(value.length);
  }

  iaQuickQuery(text: string): void {
    this.iaQuery.set(text);
    this.iaWordCount.set(text.length);
    this.generarIA();
  }

  generarIA(): void {
    const q = this.iaQuery().trim();
    if (!q) return;
    this.iaBtnText.set('Generando…');

    const userMsg = q;
    this.iaConversation.update(c => [...c, { type: 'user', text: userMsg }]);
    this.iaEmpty.set(false);

    setTimeout(() => {
      this.iaBtnText.set('Generar respuesta');
      const m = q.toLowerCase();
      const found = Object.entries(this.IA_RESP).find(([k]) => m.includes(k));
      const html = found
        ? found[1]
        : `El sistema analizó "<em>${this.esc(q)}</em>" en <strong>47 documentos</strong>. ¿Deseas filtrar por fecha o tipo?`;

      const typeLabel = this.iaQueryType() === 'puntual' ? 'Puntual' : 'Análisis';
      this.iaConversation.update(c => [...c, {
        type: 'bot', html,
        queryType: typeLabel,
        sources: ['Base_Documentos.pdf', 'Registro_Legal.xlsx'],
      }]);

      this.iaResultHtml.set(html);
      this.iaResultVisible.set(true);
      this.iaBadgeVisible.set(true);
      this.iaSourceFiles.set(['Base_Documentos.pdf', 'Registro_Legal.xlsx']);
      this.iaQuery.set('');
      this.iaWordCount.set(0);

      setTimeout(() => {
        const el = document.getElementById('ia-msgs');
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }, 1100);
  }

  guardarConsulta(botMsgIdx?: number): void {
    const conv = this.iaConversation();
    let q = '';
    let res = '';
    let sources: string[] = [];
    let queryType = '';

    if (botMsgIdx !== undefined) {
      const botMsg = conv[botMsgIdx];
      res = botMsg?.html ?? '';
      sources = botMsg?.sources ?? [];
      queryType = botMsg?.queryType ?? '';
      // la consulta del usuario está en el mensaje anterior
      const userMsg = conv[botMsgIdx - 1];
      q = userMsg?.text ?? '';
    } else {
      // fallback: último par
      const lastBot = [...conv].reverse().find(m => m.type === 'bot');
      const lastUser = [...conv].reverse().find(m => m.type === 'user');
      q = lastUser?.text ?? '';
      res = lastBot?.html ?? '';
      sources = lastBot?.sources ?? [];
      queryType = lastBot?.queryType ?? '';
    }

    if (!q && !res) { this.showToast('No hay respuesta que guardar'); return; }

    const nueva: ConsultaGuardada = {
      q,
      res,
      fecha: new Date().toLocaleDateString('es-PE'),
      sources,
      queryType,
    };
    this.consultasGuardadas.set([nueva, ...this.consultasGuardadas()]);
    this.showToast('Consulta guardada');
  }

  eliminarGuardada(index: number): void {
    const list = [...this.consultasGuardadas()];
    list.splice(index, 1);
    this.consultasGuardadas.set(list);
  }

  getPropietario(isPrivate: boolean, owner?: string): string {
    if (isPrivate) return 'Claudia Barrios (YO)';
    return owner ?? 'Público';
  }

  verDetalleConsulta(c: ConsultaGuardada | ConsultaCompartida): void {
    this.iaConversation.set([
      { type: 'user', text: c.q },
      { type: 'bot', html: c.res, sources: c.sources ?? [], queryType: c.queryType ?? '' }
    ]);
    this.currentMenu.set('procesamiento');
    this.activeSidebarCb.set('ia');
    this.currentSubProc.set('ia');
  }

  limpiarIA(): void {
    this.iaEmpty.set(true);
    this.iaResultVisible.set(false);
    this.iaBadgeVisible.set(false);
    this.iaQuery.set('');
    this.iaWordCount.set(0);
    this.iaConversation.set([]);
  }

  /* ════════════════════════════════════
     CHAT IA
  ════════════════════════════════════ */
  private getDocSug(msg: string): DocType | null {
    const m = msg.toLowerCase();
    for (const k of Object.keys(this.DOC_MAP)) {
      if (m.includes(k)) return this.DOC_MAP[k];
    }
    return null;
  }

  sendSuggestion(text: string): void {
    this.showInitSuggestions.set(false);
    const msgs = [...this.chatMessages()];
    msgs.push({ type: 'user', html: this.esc(text) });
    this.chatMessages.set(msgs);

    setTimeout(() => {
      const s = this.getDocSug(text);
      const newMsgs = [...this.chatMessages()];
      if (s) {
        const lbl = this.DOCS[s].label;
        newMsgs.push({
          type: 'bot',
          html: `Para tu caso te recomiendo una <b>${lbl}</b>.`,
          docBtn: { type: s, label: lbl },
        });
      } else {
        newMsgs.push({ type: 'bot', html: 'Cuéntame más para recomendarte el documento adecuado.' });
      }
      this.chatMessages.set(newMsgs);
    }, 700);
  }

  sendChat(): void {
    const t = this.chatInput().trim();
    if (!t) return;
    this.chatInput.set('');

    const msgs = [...this.chatMessages()];
    msgs.push({ type: 'user', html: this.esc(t) });
    this.chatMessages.set(msgs);

    setTimeout(() => {
      const s = this.getDocSug(t);
      const newMsgs = [...this.chatMessages()];
      if (s) {
        const lbl = this.DOCS[s].label;
        newMsgs.push({
          type: 'bot',
          html: `Te recomiendo generar una <b>${lbl}</b>.`,
          docBtn: { type: s, label: lbl },
        });
      } else {
        newMsgs.push({
          type: 'bot',
          html: 'Puedo ayudarte con Autorizaciones, Poderes, Actas, Contratos, Declaraciones o Renuncias. ¿Cuál es tu situación?',
        });
      }
      this.chatMessages.set(newMsgs);
    }, 800);
  }

  onIaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.generarIA();
    }
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendChat();
    }
  }

  /* ════════════════════════════════════
     FORMULARIO DINÁMICO
  ════════════════════════════════════ */
  selectDoc(type: DocType): void {
    this.currentDoc.set(type);
    const d = this.DOCS[type];
    this.formTitle.set(d.label);
    this.formSubtitle.set(d.subtitle);
    this.formIconSvg.set(d.iconSvg);
    this.formBreadcrumb.set('Generación de Documentos › ' + d.label);
    this.formFields.set(d.fields);

    this.formValues = {};
    d.fields.forEach(f => {
      this.formValues[f.id] = f.val ?? '';
    });

    this.openModal('modal-doc-form');
  }

  getFormValue(id: string): string {
    return this.formValues[id] ?? '';
  }

  setFormValue(id: string, value: string): void {
    this.formValues[id] = value;
  }

  generarDocumento(): void {
    const type = this.currentDoc();
    if (!type) return;

    const html  = this.buildDocHTML(type, this.formValues);
    const label = this.DOCS[type].label;
    const date  = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

    this.closeModal();

    const win = window.open('', '_blank', 'width=1100,height=750');
    if (!win) return;
    win.document.write(this.buildPreviewPage(html, label, date));
    win.document.close();
  }

  private buildPreviewPage(html: string, label: string, date: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${label}</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;background:#e8eaf0;min-height:100vh}
    .topbar{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid #e5e7eb;
      padding:0 24px;height:54px;display:flex;align-items:center;justify-content:space-between}
    .topbar-left{display:flex;align-items:center;gap:16px;font-size:13px;color:#6b7280}
    .topbar-meta{font-size:12px;color:#9ca3af}
    .btn-primary{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:9px;
      font-size:13px;font-weight:600;background:linear-gradient(135deg,#F47920,#D4620A);
      color:#fff;border:none;cursor:pointer}
    .btn-secondary{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;
      font-size:13px;font-weight:500;background:#fff;color:#6b7280;border:1.5px solid #e5e7eb;cursor:pointer}
    .main{display:flex;flex:1;padding:28px 20px;justify-content:center}
    .page{background:#fff;max-width:680px;width:100%;padding:48px 56px;border-radius:12px;
      box-shadow:0 4px 32px rgba(0,0,0,.1);font-size:14px;line-height:1.9;
      color:#1f2937;font-family:'Times New Roman',serif}
    /* confirm overlay */
    .confirm-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);
      z-index:100;align-items:center;justify-content:center}
    .confirm-bg.show{display:flex}
    .confirm-box{background:#fff;border-radius:18px;padding:32px 28px;text-align:center;
      max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2)}
    .confirm-icon{width:58px;height:58px;border-radius:50%;background:#fff3e8;border:2px solid rgba(244,121,32,.3);
      display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
    .confirm-title{font-size:18px;font-weight:700;color:#F47920;margin-bottom:10px;font-family:'Segoe UI',sans-serif}
    .confirm-sub{font-size:13.5px;color:#6b7280;line-height:1.6;margin-bottom:22px}
    .confirm-btns{display:flex;gap:10px;justify-content:center}
    @media print{.topbar,.confirm-bg{display:none!important}.main{padding:0}.page{box-shadow:none;border-radius:0;max-width:100%}}
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-left">
      <span>${label}</span>
      <span class="topbar-meta">Generado por GEPDIA IA · ${date}</span>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn-primary" onclick="aceptar()">Aceptar</button>
      <button class="btn-secondary" onclick="window.close()">Cancelar</button>
    </div>
  </div>
  <div class="main">
    <div class="page">${html}</div>
  </div>

  <!-- Confirm modal -->
  <div class="confirm-bg" id="confirmBg">
    <div class="confirm-box">
      <div class="confirm-icon">
        <svg width="26" height="26" fill="none" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="14" fill="#F47920"/>
          <polyline points="8,15 13,20 22,10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="confirm-title">Documento aceptado</div>
      <div class="confirm-sub">El documento ha sido aceptado.<br>Se procederá a imprimir.</div>
      <div class="confirm-btns">
        <button class="btn-primary" onclick="window.print()">Imprimir</button>
        <button class="btn-secondary" onclick="window.close()">Cancelar</button>
      </div>
    </div>
  </div>

  <script>
    function aceptar(){document.getElementById('confirmBg').classList.add('show');}
  </script>
</body>
</html>`;
  }

  private buildDocHTML(type: DocType, d: Record<string, string>): string {
    const dia = new Date().getDate();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mes = meses[new Date().getMonth()];
    const fecha = `${dia} de ${mes} de ${new Date().getFullYear()}`;

    const hdr = (t: string) =>
      `<div style="text-align:center;margin-bottom:32px"><p style="font-size:11px;color:var(--textL);text-transform:uppercase;letter-spacing:.1em">GEPDIA · Sistema de Documentos</p><h1 style="font-size:22px;font-weight:700;color:var(--orange);margin:8px 0 4px;font-family:'Sora',sans-serif">${t}</h1><div style="width:60px;height:3px;background:var(--orange);margin:0 auto;border-radius:2px"></div></div>`;

    const firma = (nom: string, lbl: string, dni?: string) =>
      `<div style="text-align:center;width:45%"><div style="border-top:1.5px solid #d1d5db;padding-top:8px"><p style="font-size:13px;font-weight:600">${this.esc(nom) || '____________'}</p>${dni ? `<p style="font-size:12px;color:var(--muted)">DNI: ${this.esc(dni)}</p>` : ''}<p style="font-size:12px;color:var(--muted)">${lbl}</p></div></div>`;

    if (type === 'autorizacion') {
      return hdr('CARTA DE AUTORIZACIÓN') +
        `<p style="margin-bottom:18px;text-align:justify">Yo, <b>${this.esc(d['nombres']) || '___'}</b>, con DNI N° <b>${this.esc(d['dni']) || '___'}</b>, domicilio en <b>${this.esc(d['direccion']) || '___'}</b>; autorizo a:</p>
        <div style="background:var(--orangeSoft);border-left:4px solid var(--orange);border-radius:0 8px 8px 0;padding:14px 18px;margin:18px 0"><p><b>Autorizado:</b> ${this.esc(d['autorizado']) || '___'} &nbsp; <b>DNI:</b> ${this.esc(d['dni_autorizado']) || '___'}</p></div>
        <p>Para realizar: <em>"${this.esc(d['tramite']) || '___'}"</em></p>
        ${d['fecha'] ? `<p style="margin-top:12px">Válida hasta el <b>${d['fecha']}</b>.</p>` : ''}
        <p style="margin-top:18px">Lima, ${fecha}.</p>
        <div style="margin-top:48px;display:flex;justify-content:space-between">${firma(d['nombres'], 'Autorizante', d['dni'])}${firma(d['autorizado'], 'Autorizado', d['dni_autorizado'])}</div>`;
    } else if (type === 'poder') {
      return hdr('CARTA PODER') +
        `<p style="margin-bottom:18px;text-align:justify">Yo, <b>${this.esc(d['poderdante']) || '___'}</b>, con DNI N° <b>${this.esc(d['dni']) || '___'}</b>, domicilio en <b>${this.esc(d['direccion']) || '___'}</b>; otorgo <b>CARTA PODER</b> a:</p>
        <div style="background:var(--orangeSoft);border-left:4px solid var(--orange);border-radius:0 8px 8px 0;padding:14px 18px;margin:18px 0"><p><b>Apoderado:</b> ${this.esc(d['apoderado']) || '___'}</p><p style="margin-top:4px"><b>DNI:</b> ${this.esc(d['dni_apoderado']) || '___'}</p></div>
        <p>Facultades: <em>"${this.esc(d['facultades']) || '___'}"</em></p>
        <p style="margin-top:18px">Lima, ${fecha}.</p>
        <div style="margin-top:48px;display:flex;justify-content:space-between">${firma(d['poderdante'], 'Poderdante', d['dni'])}${firma(d['apoderado'], 'Apoderado', d['dni_apoderado'])}</div>`;
    } else if (type === 'renuncia') {
      return `<div style="text-align:right;margin-bottom:24px;font-size:13px;color:var(--muted)">Lima, ${fecha}</div>
        <p style="font-weight:600">${this.esc(d['jefe']) || 'Gerencia General'}</p>
        <p style="color:var(--muted);margin-bottom:24px">${this.esc(d['empresa']) || '___'}</p>
        <p style="font-weight:700;font-size:15px;color:var(--orange);text-align:center;font-family:'Sora',sans-serif">CARTA DE RENUNCIA VOLUNTARIA</p>
        <div style="width:60px;height:3px;background:var(--orange);margin:6px auto 24px;border-radius:2px"></div>
        <p style="text-align:justify;margin-bottom:16px">Por medio del presente, yo <b>${this.esc(d['nombres']) || '___'}</b>, con DNI N° <b>${this.esc(d['dni']) || '___'}</b>, desempeñando el cargo de <b>${this.esc(d['cargo']) || '___'}</b>, manifiesto mi <b>renuncia voluntaria e irrevocable</b>.</p>
        ${d['motivo'] ? `<p style="margin-bottom:16px">Motivo: <i>${this.esc(d['motivo'])}</i></p>` : ''}
        ${d['fecha_efectiva'] ? `<p style="margin-bottom:16px">Efectiva desde el <b>${d['fecha_efectiva']}</b>.</p>` : ''}
        <div style="margin-top:48px;text-align:center">${firma(d['nombres'], 'Firmante', d['dni'])}</div>`;
    } else {
      const titulo = ({ acta: 'ACTA', contrato: 'CONTRATO', declaracion: 'DECLARACIÓN JURADA' } as Record<string, string>)[type] || type.toUpperCase();
      return hdr(titulo) +
        `<p style="font-size:13px;color:var(--muted);text-align:center;margin-bottom:18px">Lima, ${fecha}</p>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${Object.entries(d).filter(([, v]) => v).map(([k, v]) =>
          `<div style="background:var(--orangeSoft);border-radius:8px;padding:12px 16px;border:1px solid rgba(244,121,32,.2)">
            <p style="font-size:11px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">${k.replace(/_/g, ' ')}</p>
            <p style="font-size:14px">${this.esc(v)}</p>
          </div>`).join('')}
        </div>
        <div style="margin-top:48px;text-align:center"><div style="display:inline-block"><div style="border-top:1.5px solid #d1d5db;padding-top:8px;min-width:200px"><p style="font-size:13px;color:var(--muted)">Firma y sello</p></div></div></div>`;
    }
  }

  /* ════════════════════════════════════
     FAVORITOS & PAPELERA
  ════════════════════════════════════ */
  getActiveFolders(): FolderItem[] {
    return this.folders().filter(f => !f.inPapelera);
  }

  getActiveFiles(): FileItem[] {
    return this.files().filter(f => !f.inPapelera);
  }

  getSharedFilesForFolder(folderName: string): (FileItem & { sharedBy: string })[] {
    const folder = this.sharedFoldersWithMe().find(f => f.name === folderName);
    if (!folder) return [];
    return this.sharedFilesWithMe().filter(f => folder.files.includes(f.name));
  }

  getFolderIconColor(folder: FolderItem): string {
    if (folder.favorite) return '#F59E0B';                                           // dorado — favorita
    if (folder.sharedWith && folder.sharedWith !== 'none') return '#10B981';         // verde — compartida
    return '#F47920';                                                                // naranja — propia (default)
  }

  getFolderSharedLabel(folder: FolderItem): string | null {
    if (Array.isArray(folder.sharedWith) && folder.sharedWith.length > 0)
      return `${folder.sharedWith.length} usuario(s)`;
    if (folder.sharedWith === 'all') return 'Todos';
    return null;
  }

  getFavoriteFolders(): FolderItem[] {
    return this.folders().filter(f => f.favorite && !f.inPapelera);
  }

  getPapeleraFolders(): FolderItem[] {
    return this.folders().filter(f => !!f.inPapelera);
  }

  getPapeleraFiles(): FileItem[] {
    return this.files().filter(f => !!f.inPapelera);
  }

  toggleFolderFavorite(name: string): void {
    const isFav = !this.folders().find(f => f.name === name)?.favorite;
    this.folders.set(this.folders().map(f => f.name === name ? { ...f, favorite: isFav } : f));
    this.showToast(isFav ? '⭐ Marcado como favorito' : 'Quitado de favoritos');
  }

  moveFolderToTrash(name: string): void {
    this.folders.set(this.folders().map(f => f.name === name ? { ...f, inPapelera: true, papeleraDate: new Date().toISOString() } : f));
    if (this.currentFolder() === name) this.closeFolder();
    this.showToast('Carpeta movida a Papelera');
  }

  restoreFolderFromTrash(name: string): void {
    this.folders.set(this.folders().map(f => f.name === name ? { ...f, inPapelera: false, papeleraDate: undefined } : f));
    this.showToast('Carpeta restaurada');
  }

  permanentDeleteFolder(name: string): void {
    this.folders.set(this.folders().filter(f => f.name !== name));
    this.showToast('Carpeta eliminada permanentemente');
  }

  pedirConfirmacionPapelera(id: string): void {
    this.trashTargetFileId.set(id);
    this.openModal('modal-confirm-trash');
  }

  confirmarMoverPapelera(): void {
    const id = this.trashTargetFileId();
    if (!id) return;
    this.moveFileToTrash(id);
    this.closeModal();
  }

  moveFileToTrash(id: string): void {
    this.files.set(this.files().map(f => f.id === id ? { ...f, inPapelera: true, papeleraDate: new Date().toISOString() } : f));
    this.selectedFiles.set(new Set([...this.selectedFiles()].filter(x => x !== id)));
    this.showToast('Documento movido a Papelera');
  }

  restoreFileFromTrash(id: string): void {
    this.files.set(this.files().map(f => f.id === id ? { ...f, inPapelera: false, papeleraDate: undefined } : f));
    this.showToast('Documento restaurado');
  }

  permanentDeleteFile(id: string): void {
    this.files.set(this.files().filter(f => f.id !== id));
    this.showToast('Documento eliminado permanentemente');
  }

  daysInTrash(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  }

  daysRemaining(dateStr: string): number {
    return Math.max(0, 20 - this.daysInTrash(dateStr));
  }

  /* ════════════════════════════════════
     COMPARTIR
  ════════════════════════════════════ */
  abrirShareModalFolder(name: string): void {
    this.shareTargetFolder.set(name);
    this.shareTargetFile.set(null);
    const folder = this.folders().find(f => f.name === name);
    const current = folder?.sharedWith ?? 'none';
    if (current === 'all') this.shareMode.set('all');
    else if (Array.isArray(current)) { this.shareMode.set('users'); this.shareSelectedUsers.set([...current]); }
    else { this.shareMode.set('none'); this.shareSelectedUsers.set([]); }
    this.shareUserSearch.set('');
    this.openModal('modal-share');
  }

  abrirShareModalFile(id: string): void {
    this.shareTargetFolder.set(null);
    this.shareTargetFile.set(id);
    const file = this.files().find(f => f.id === id);
    const current = file?.sharedWith ?? 'none';
    if (current === 'all') this.shareMode.set('all');
    else if (Array.isArray(current)) { this.shareMode.set('users'); this.shareSelectedUsers.set([...current]); }
    else { this.shareMode.set('none'); this.shareSelectedUsers.set([]); }
    this.shareUserSearch.set('');
    this.openModal('modal-share');
  }

  confirmarShare(): void {
    const mode = this.shareMode();
    const value: FolderItem['sharedWith'] =
      mode === 'none'  ? 'none' :
      mode === 'all'   ? 'all'  :
      [...this.shareSelectedUsers()];

    const folderName = this.shareTargetFolder();
    const fileId = this.shareTargetFile();

    if (folderName) {
      this.folders.update(list => list.map(f => f.name === folderName ? { ...f, sharedWith: value } : f));
    }
    if (fileId) {
      this.files.update(list => list.map(f => f.id === fileId ? { ...f, sharedWith: value } : f));
    }
    const label =
      mode === 'none'  ? 'Privado' :
      mode === 'all'   ? 'Compartido con todos' :
      'Compartido con usuarios seleccionados';
    this.showToast(`✓ ${label}`);
    this.closeModal();
  }

  toggleShareUser(id: string): void {
    const current = this.shareSelectedUsers();
    if (current.includes(id)) {
      this.shareSelectedUsers.set(current.filter(u => u !== id));
    } else {
      this.shareSelectedUsers.set([...current, id]);
    }
  }

  consultarIACarpeta(name: string): void {
    this.iaContextFolder.set(name);
    this.iaContextFile.set(null);
    this.sdiClick('ia');
  }

  consultarIAArchivo(id: string): void {
    const file = this.files().find(f => f.id === id)
      ?? this.sharedFilesWithMe().find(f => f.id === id);
    if (!file) return;
    this.iaContextFile.set(file.name);
    this.iaContextFolder.set(null);
    this.sdiClick('ia');
  }

  limpiarContextoIA(): void {
    this.iaContextFolder.set(null);
    this.iaContextFile.set(null);
  }

  abrirReordenarPaginas(f: FileItem): void {
    const pages = f.pages ?? 1;
    this.reorderPageOrder.set(Array.from({ length: pages }, (_, i) => i + 1));
    this.reorderFileId.set(f.id);
    this.openModal('modal-reorder-pages');
  }

  moverPaginaArriba(idx: number): void {
    if (idx === 0) return;
    const arr = [...this.reorderPageOrder()];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    this.reorderPageOrder.set(arr);
  }

  moverPaginaAbajo(idx: number): void {
    const arr = this.reorderPageOrder();
    if (idx === arr.length - 1) return;
    const copy = [...arr];
    [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
    this.reorderPageOrder.set(copy);
  }

  confirmarReordenarPaginas(): void {
    this.showToast('✓ Orden de páginas actualizado');
    this.closeModal();
  }

  getFileTypeBadgeStyle(fileType?: string): string {
    switch (fileType) {
      case 'PDF':   return 'background:#fee2e2;color:#dc2626;border:1px solid #fca5a5';
      case 'Word':  return 'background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd';
      case 'Excel': return 'background:#dcfce7;color:#16a34a;border:1px solid #86efac';
      default:      return 'background:var(--bg);color:var(--textL);border:1px solid var(--border)';
    }
  }

  /* ════════════════════════════════════
     ARCHIVOS
  ════════════════════════════════════ */
  handleFileSelectDoc(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedDocFile = file;
      this.docFilename.set('📎 ' + file.name);
      this.newDocName.set(file.name.replace(/\.[^.]+$/, ''));
    }
  }

  handleFileSelectPlantilla(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.plantillaFilename.set('📎 ' + file.name);
    }
  }

  handleFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.newDocDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedDocFile = file;
      this.docFilename.set('📎 ' + file.name);
      this.newDocName.set(file.name.replace(/\.[^.]+$/, ''));
    }
  }

  cargarDocumento(): void {
    if (!this.selectedDocFile) { this.showToast('Selecciona un archivo'); return; }
    const fileName = this.selectedDocFile.name;
    const displayName = this.newDocName().trim() || fileName;
    const isPrivate = this.newDocPrivacy() === 'privado';
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: displayName,
      type: 'Documento',
      typeBadge: 'b-gray',
      fecha: new Date().toLocaleDateString('es-PE'),
      private: isPrivate,
      pages: 1,
      estado: 'Cargado',
      fileType: fileName.endsWith('.docx') || fileName.endsWith('.doc') ? 'Word'
              : fileName.endsWith('.xlsx') || fileName.endsWith('.xls') ? 'Excel'
              : 'PDF',
    };
    this.files.set([...this.files(), newFile]);
    if (this.newDocFolder()) {
      const targetFolder = this.newDocFolder();
      this.folders.set(this.folders().map(f =>
        f.name === targetFolder ? { ...f, files: [...f.files, displayName] } : f
      ));
    }
    this.closeModal();
    this.showToast(`"${displayName}" subido exitosamente`);
    this.selectedDocFile = null;
    this.docFilename.set('');
    this.newDocName.set('');
    this.newDocDescription.set('');
    this.newDocPrivacy.set('privado');
    this.newDocFolder.set('');
  }

  abrirNuevaPlantilla(): void {
    this.plantillaEditMode.set(false);
    this.plantillaFilename.set('');
    this.openModal('modal-nueva-plantilla');
  }

  abrirEditarPlantilla(): void {
    this.plantillaEditMode.set(true);
    this.plantillaFilename.set('');
    this.openModal('modal-nueva-plantilla');
  }

  guardarPlantilla(): void {
    this.closeModal();
    this.showToast(this.plantillaEditMode() ? 'Plantilla actualizada' : 'Plantilla guardada exitosamente');
  }

  /* ════════════════════════════════════
     IMPRIMIR
  ════════════════════════════════════ */
  imprimir(): void {
    this.closeModal();
    const html  = this.docContentHtml();
    const label = this.docLabel();
    const win   = window.open('', '_blank', 'width=860,height=720');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${label}</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;padding:0;background:#e8eaf0;font-family:'Times New Roman',serif}
    .page{background:#fff;max-width:680px;margin:32px auto;padding:48px 56px;box-shadow:0 4px 24px rgba(0,0,0,.08);font-size:14px;line-height:1.9;color:#1a1a2e}
    strong,b{color:#1a1a2e}
    @media print{body{background:#fff}.page{margin:0;box-shadow:none}}
  </style>
</head>
<body>
  <div class="page">${html}</div>
  <script>window.onload=function(){window.print()};<\/script>
</body>
</html>`);
    win.document.close();
  }

  /* ════════════════════════════════════
     HELPERS
  ════════════════════════════════════ */
  private esc(t: string): string {
    if (!t) return '';
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  trackByIndex(index: number): number {
    return index;
  }
}
