import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch(error.status) {
        case 403:
          //Forbidden — user is authenticated but not authorized
          router.navigateByUrl('/403');
          break;
        case 404:
          //Not found — navigate to 404 page
          router.navigateByUrl('/404');
          break;
        case 500:
          //Server error — navigate to 500 page or show global error
          router.navigateByUrl('/404');
          break;
      }

      //Re-throw the error so the component can handle it if needed
      return throwError(() => error);
    })
  );
};
