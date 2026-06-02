import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
}
