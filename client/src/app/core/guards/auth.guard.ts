import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '@core/services/token/token.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  //If tokens exist, the user has an active session
  if(tokenService.hasAccessToken()) return true;

  //No tokens, user gets sent to Login page
  //CreateUrlTree is not as imperative as NavigateByUrl. Better usage for Guards
  return router.createUrlTree(['auth/login']);
};
