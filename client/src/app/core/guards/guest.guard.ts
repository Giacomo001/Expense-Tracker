import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '@core/services/token/token.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  //If no tokens, the user is a guest and can access Login/Registration page
  if(!tokenService.hasAccessToken()) return true;

  //Already authenticated. User goes on the homepage
  return router.createUrlTree(['/']);
};
