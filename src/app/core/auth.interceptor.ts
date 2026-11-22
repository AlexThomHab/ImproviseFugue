import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/') || req.url.startsWith('/api/auth/')) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);
  const withToken = (r: HttpRequest<unknown>) =>
    auth.accessToken ? r.clone({ setHeaders: { Authorization: `Bearer ${auth.accessToken}` } }) : r;

  const ensureFresh = auth.isAuthenticated() && auth.tokenNeedsRefresh ? auth.refresh().catch(() => undefined) : Promise.resolve();

  return from(ensureFresh).pipe(
    switchMap(() => next(withToken(req))),
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !auth.isAuthenticated()) return throwError(() => err);
      return from(auth.refresh()).pipe(
        switchMap(() => next(withToken(req))),
        catchError((refreshErr) => {
          auth.clear();
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
