import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortalComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);
  private sliderInterval: ReturnType<typeof setInterval> | null = null;

  banners = [
    'assets/img/Banner3_1.png',
    'assets/img/Banner3_2.png',
    'assets/img/Banner3_3.png'
  ];

  sliderIndex = signal(0);

  ngOnInit() {
    const auth = this.authService.obtenerAuth();
    if (!auth) {
      this.router.navigate(['/login']);
      return;
    }
    this.sliderInterval = setInterval(() => {
      this.sliderIndex.update(i => (i + 1) % this.banners.length);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.sliderInterval !== null) {
      clearInterval(this.sliderInterval);
    }
  }

  logout() {
    this.authService.logout();
  }

  // Un <a target="_blank"> normal no clona sessionStorage de forma confiable en
  // Chromium (el login vive ahí) — window.open() sí lo hace, así que abrimos SPL
  // así en vez de dejar que el <a> navegue de forma nativa. Se usa Location para
  // que respete el base href real (ej. GitHub Pages en /SigOne-Judicial/) en vez
  // de asumir que la app vive en la raíz del dominio.
  abrirSplNuevaPestana(event: Event) {
    event.preventDefault();
    window.open(this.location.prepareExternalUrl('/spl'), '_blank');
  }
}
