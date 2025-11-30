import { Routes } from '@angular/router';
import { AuthGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
    // Rutas públicas (sin autenticación)
    {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login/login.component').then( m => m.LoginComponent)
    },
    {
        path: 'auth/callback',
        loadComponent: () => import('./features/auth/components/callback/callback.component').then( m => m.CallbackComponent)
    },

    // Rutas protegidas (requieren autenticación)
    {
        path: '',
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./app.component').then( m => m.AppComponent) // Aquí irá tu componente principal
            }
        ]
    },

    // Redirección por defecto
    {
        path: '**',
        redirectTo: 'login'
    }

];
