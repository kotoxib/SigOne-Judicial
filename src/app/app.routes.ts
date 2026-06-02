import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { Configuracion } from './components/configuracion/configuracion.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  { path: 'configuracion', component: Configuracion, canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' }
];
