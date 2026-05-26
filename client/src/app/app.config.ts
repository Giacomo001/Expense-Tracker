import { inject, LOCALE_ID, provideAppInitializer } from '@angular/core';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@core/interceptors/auth/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error/error.interceptor';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { AuthService } from '@core/services/auth/auth.service';
import { TokenService } from '@core/services/token/token.service';
import { catchError, firstValueFrom, of } from 'rxjs';

registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(routes),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-bottom-right',
      preventDuplicates: true
    }),
    { provide: LOCALE_ID, useValue: 'it-IT' },
    provideAppInitializer(async () => { //It creates silently a new RefreshToken so refreshing the page won't require a new login all the times
      const authService = inject(AuthService);
      const tokenService = inject(TokenService);

      if (!tokenService.getRefreshToken()) return;

      await firstValueFrom(
        authService.refresh().pipe(
          catchError(() => {
            tokenService.clearTokens();
            return of(null);
          })
        )
      );
    })
  ]
};
