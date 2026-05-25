import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toast = inject(ToastrService);

  success(message: string) {
    this.toast.success(message, undefined, {
      timeOut: 3000,
      positionClass: 'toast-bottom-right'
    });
  }

  error(message: string) {
    this.toast.error(message, undefined, {
      disableTimeOut: true,
      positionClass: 'toast-bottom-right',
      closeButton: true
    });
  }

  warning(message: string) {
    this.toast.warning(message, undefined, {
      disableTimeOut: true,
      positionClass: 'toast-bottom-right',
      closeButton: true
    });
  }

  loading<T>(obs$: Observable<T>, messages: {
    loading: string;
    success: string;
    error: string | ((err: any) => string);
  }): Observable<T> {
    const loadingToast = this.toast.info(messages.loading, undefined, {
      disableTimeOut: true,
      positionClass: 'toast-bottom-right',
      closeButton: true
    });

    return obs$.pipe(
      tap(() => {
        this.toast.remove(loadingToast.toastId);
        this.success(messages.success);
      }),
      catchError((err) => {
        this.toast.remove(loadingToast.toastId);
        const errorMsg = typeof messages.error === 'function'
          ? messages.error(err)
          : messages.error;
        this.error(errorMsg);
        return throwError(() => err);
      })
    );
  }
}
