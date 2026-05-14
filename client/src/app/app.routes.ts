import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/expenses/expenses.component').then(m => m.ExpensesComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () =>
          import('@features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('@features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: '404',
    loadComponent: () =>
      import('@shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    redirectTo: '404'
  }
];