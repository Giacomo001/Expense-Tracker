import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';
import { LayoutBaseComponent } from '@layout/layout-base/layout-base.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'expenses',
        loadComponent: () =>
          import('@features/expenses/expenses.component').then(m => m.ExpensesComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('@features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('@features/budgets/budgets.component').then(m => m.BudgetsComponent)
      },
      {
        path: 'recurring-expenses',
        loadComponent: () =>
          import('@features/recurring-expenses/recurring-expenses.component').then(m => m.RecurringExpensesComponent)
      },
      { 
        path: '', 
        redirectTo: 'expenses', 
        pathMatch: 'full' 
      }
    ]
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
      },
      {
        path: 'reset-password',
        loadComponent: () => 
          import('@features/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
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