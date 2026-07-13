import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'home',
    canActivate: [AuthGuard],
    loadComponent: () => import('./layout/layout').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'anasayfa', pathMatch: 'full' },
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'students',
        loadComponent: () => import('./students/students').then((m) => m.StudentsComponent),
      },
      {
        path: 'teachers',
        loadComponent: () => import('./teachers/teachers').then((m) => m.TeachersComponent),
      },
      {
        path: 'parents',
        loadComponent: () => import('./parents/parents').then((m) => m.ParentsComponent),
      },
      {
        path: 'transport',
        loadComponent: () => import('./school-bus/school-bus').then((m) => m.SchoolBusComponent),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
