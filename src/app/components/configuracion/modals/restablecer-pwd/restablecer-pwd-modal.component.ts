import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-restablecer-pwd-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
      <div class="cfg-modal-bg-g" (click)="onClose()">
        <div class="cfg-modal-g" style="max-width:400px" (click)="$event.stopPropagation()">
          <div class="cfg-modal-title-g">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(34,197,94,.15)">
              <svg class="w-4 h-4" style="color:#22C55E" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            Restablecer Contraseña
            <button class="ml-auto" style="color:#9CA3AF;background:none;border:none;cursor:pointer" (click)="onClose()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <p class="text-sm mb-4" style="color:#6B7280">Usuario: <strong>{{ usernameLabel }}</strong></p>
          <div>
            <label>Nueva contraseña <span style="color:#EF4444">*</span></label>
            <input type="password" placeholder="Mínimo 6 caracteres" maxlength="25" [(ngModel)]="nueva"/>
          </div>
          <div>
            <label>Repite contraseña <span style="color:#EF4444">*</span></label>
            <input type="password" placeholder="••••••" maxlength="25" [(ngModel)]="nueva2"/>
          </div>
          <div class="flex gap-3 justify-end mt-2">
            <button class="btn-secondary" (click)="onClose()">Cancelar</button>
            <button class="btn-orange" (click)="confirmar()">Confirmar</button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RestablecerPwdModalComponent {
  @Input() visible = false;
  @Input() usernameLabel = '';
  @Input() usuarioId: string | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() pwdGuardada = new EventEmitter<{ id: string; pwdHash: string }>();

  nueva = '';
  nueva2 = '';

  open() { this.nueva = ''; this.nueva2 = ''; }

  confirmar() {
    if (!this.nueva) { alert('Ingresa la contraseña'); return; }
    if (this.nueva.length < 6) { alert('Mínimo 6 caracteres'); return; }
    if (this.nueva !== this.nueva2) { alert('Las contraseñas no coinciden'); return; }
    this.pwdGuardada.emit({ id: this.usuarioId!, pwdHash: btoa(this.nueva) });
    this.onClose();
  }

  onClose() { this.nueva = ''; this.nueva2 = ''; this.closed.emit(); }
}
