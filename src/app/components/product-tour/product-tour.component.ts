import { Component, Input, inject, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductTourService } from '../../services/product-tour.service';

@Component({
  selector: 'app-product-tour',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-tour.component.html',
  styleUrl: './product-tour.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTourComponent {
  @Input() ruta: string = '';

  tour = inject(ProductTourService);

  spotlightStyle = signal<Record<string, string>>({});
  bubbleStyle    = signal<Record<string, string>>({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });

  constructor() {
    effect(() => {
      const activo = this.tour.tourActivo();
      const paso   = this.tour.pasoInfo;
      if (activo && paso) {
        setTimeout(() => this.posicionar(paso!.targetId, paso!.bubblePos), 80);
      }
    });
  }

  private posicionar(targetId?: string, pos?: string) {
    const PAD    = 8;
    const MARGIN = 20;

    if (!targetId || pos === 'center') {
      this.spotlightStyle.set({});
      this.bubbleStyle.set({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
      return;
    }

    const el = document.getElementById(targetId);
    if (!el) {
      this.spotlightStyle.set({});
      this.bubbleStyle.set({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
      return;
    }

    const r = el.getBoundingClientRect();
    this.spotlightStyle.set({
      top:    `${r.top    - PAD}px`,
      left:   `${r.left   - PAD}px`,
      width:  `${r.width  + PAD * 2}px`,
      height: `${r.height + PAD * 2}px`,
    });

    const cx = `${r.left + r.width  / 2}px`;
    const cy = `${r.top  + r.height / 2}px`;

    switch (pos) {
      case 'top':
        this.bubbleStyle.set({ bottom: `${window.innerHeight - r.top + MARGIN}px`, left: cx, transform: 'translateX(-50%)' });
        break;
      case 'bottom':
        this.bubbleStyle.set({ top: `${r.bottom + MARGIN}px`, left: cx, transform: 'translateX(-50%)' });
        break;
      case 'left':
        this.bubbleStyle.set({ top: cy, right: `${window.innerWidth - r.left + MARGIN}px`, transform: 'translateY(-50%)' });
        break;
      case 'right':
        this.bubbleStyle.set({ top: cy, left: `${r.right + MARGIN}px`, transform: 'translateY(-50%)' });
        break;
      default:
        this.bubbleStyle.set({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
    }
  }

  iniciarTour() {
    this.tour.iniciarTourRuta(this.ruta || this.tour.rutaActual());
  }
}
