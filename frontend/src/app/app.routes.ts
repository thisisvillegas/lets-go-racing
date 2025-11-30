import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
    },
    {
        path: 'callback',
        loadComponent: () => import('./pages/callback/callback.component').then(m => m.CallbackComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'preferences',
        loadComponent: () => import('./pages/preferences/preferences.component').then(m => m.PreferencesComponent),
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];