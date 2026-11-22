import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/landing.page').then((m) => m.LandingPage) },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · Improvising Fugue',
    loadComponent: () => import('./pages/auth.page').then((m) => m.AuthPage),
    data: { mode: 'login' },
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Create account · Improvising Fugue',
    loadComponent: () => import('./pages/auth.page').then((m) => m.AuthPage),
    data: { mode: 'register' },
  },
  {
    path: 'lesson/:slug',
    canActivate: [authGuard],
    title: 'Lesson · Improvising Fugue',
    loadComponent: () => import('./pages/lesson-player.page').then((m) => m.LessonPlayerPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: 'dashboard', title: 'Home · Improvising Fugue', loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage) },
      { path: 'learn', title: 'Learn · Improvising Fugue', loadComponent: () => import('./pages/learn.page').then((m) => m.LearnPage) },
      { path: 'review', title: 'Review · Improvising Fugue', loadComponent: () => import('./pages/review.page').then((m) => m.ReviewPage) },
      { path: 'account', title: 'Account · Improvising Fugue', loadComponent: () => import('./pages/account.page').then((m) => m.AccountPage) },
      { path: 'premium', title: 'Premium · Improvising Fugue', loadComponent: () => import('./pages/premium.page').then((m) => m.PremiumPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
