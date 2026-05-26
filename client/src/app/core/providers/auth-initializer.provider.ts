import { provideAppInitializer, inject } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { TokenService } from '@core/services/token/token.service';
import { firstValueFrom, catchError, of } from 'rxjs';

export const authInitializerProvider = provideAppInitializer(async () => {
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
});