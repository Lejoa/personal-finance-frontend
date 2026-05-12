import { Routes } from '@angular/router';
import { AuthGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
    // Public routes (no authentication required)
    {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login/login.component').then( m => m.LoginComponent)
    },
    {
        path: 'auth/callback',
        loadComponent: () => import('./features/auth/components/callback/callback.component').then( m => m.CallbackComponent)
    },

    // Protected routes (authentication required)
    {
        path: '',
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/main/main.component').then( m => m.MainComponent)
            }
        ]
    },

    // Default redirect
    {
        path: '**',
        redirectTo: 'login'
    }

];
