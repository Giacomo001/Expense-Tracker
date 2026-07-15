import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { TokenService } from '@core/services/token/token.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);

  const authReq = addAuthHeader(req, tokenService.getAccessToken());

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      //If 401 and a refresh token exists, attempt to refresh the access token
      if(error.status === 401) {
        return authService.refresh().pipe(
          switchMap(() => {
            //Retry the original request with the new access token
            const retryReq = addAuthHeader(req, tokenService.getAccessToken());
            return next(retryReq);
          }),
          catchError(refreshError => {
            //Refresh failed — session is expired, logout the user
            tokenService.clearAccessToken();
            authService['accountService'].logout();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

//Clones the request and add the Bearer token to the headers
function addAuthHeader(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if(!token) return req;

  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}