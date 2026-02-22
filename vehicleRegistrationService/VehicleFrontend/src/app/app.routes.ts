import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/portal/portal.component').then(m => m.PortalComponent)
  },
  {
    path: 'mup-vozila',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'saobracajna-policija',
    // canActivate: [authGuard],
    loadComponent: () => import('./components/saobracajna-policija/saobracajna-policija.component').then(m => m.SaobracajnaPolicija)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'services/register-vehicle',
    canActivate: [authGuard],
    loadComponent: () => import('./components/register-vehicle/register-vehicle').then(m => m.RegisterVehicle)
  },
  {
    path: 'services/renew-registration',
    canActivate: [authGuard],
    loadComponent: () => import('./components/renew-registration/renew-registration').then(m => m.RenewRegistration)
  },
  {
    path: 'admin/registration-requests',
    canActivate: [authGuard],
    loadComponent: () => import('./components/admin-registration-requests/admin-registration-requests').then(m => m.AdminRegistrationRequests)
  },
  {
    path: 'transfer-requests',
    canActivate: [authGuard],
    loadComponent: () => import('./components/transfer-requests/transfer-requests').then(m => m.TransferRequests)
  },
  {
    path: 'services/change-plates',
    canActivate: [authGuard],
    loadComponent: () => import('./components/change-plates/change-plates.component').then(m => m.ChangePlatesComponent)
  },
  {
    path: 'services/deregister-vehicle',
    canActivate: [authGuard],
    loadComponent: () => import('./components/deregister-vehicle/deregister-vehicle.component').then(m => m.DeregisterVehicleComponent)
  },
  {
    path: 'services/:serviceName',
    canActivate: [authGuard],
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  }
];
