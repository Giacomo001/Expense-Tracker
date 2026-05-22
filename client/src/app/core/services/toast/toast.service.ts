import { inject, Injectable } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toast = inject(HotToastService);

  success(message: string) {
    this.toast.success(message, {
      duration: 3000,
      position: "bottom-right",
      className: "custom-success"
    });
  }

  error(message: string) {
    this.toast.error(message, {
      duration: 3000,
      position: "bottom-right",
      autoClose: false,
      className: "custom-error"
    });
  }

  warning(message: string) {
    this.toast.warning(message, {
      duration: 3000,
      position: "bottom-right",
      autoClose: false,
      className: "custom-warning"
    });
  }

  loading<T>(obs$: Observable<T>, messages: {
    loading: string;
    success: string;
    error: string | ((err: any) => string);
  }) {
    return obs$.pipe(
      this.toast.observe({
        loading: { content: messages.loading, position: 'bottom-right', className: 'custom-loading' },
        success: { content: messages.success, position: 'bottom-right', className: 'custom-success' },
        error: { content: messages.error, position: 'bottom-right', className: 'custom-error' },
      })
    );
  }
}
