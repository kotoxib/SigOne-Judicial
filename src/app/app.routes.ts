import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { Configuracion } from './components/configuracion/configuracion.component';
import { PortalComponent } from './components/portal/portal.component';
import { SPL } from './components/spl/spl.component';
import { GapComponent } from './components/gap/gap.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login',         component: LoginComponent },

  { path: 'portal',        component: PortalComponent,  canActivate: [authGuard] },
  { path: 'configuracion', component: Configuracion,     canActivate: [authGuard] },
  { path: 'spl',           component: SPL,               canActivate: [authGuard] },
  { path: 'gap',           component: GapComponent,      canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' }
];
