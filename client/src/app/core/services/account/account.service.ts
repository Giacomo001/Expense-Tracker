import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoggedUser } from '@features/auth/models/logged-user.model';
import { TokenService } from '../token/token.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private router = inject(Router);
  private tokenService = inject(TokenService);

  loggedUser = signal<LoggedUser | null>(this.loadFromStorage());

  private loadFromStorage(): LoggedUser | null {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setLoggedUser(user: LoggedUser) {
    sessionStorage.setItem('user', JSON.stringify(user));
    this.loggedUser.set(user);
  }

  removeLocalData() {
    //Removes the data from token to loggedUser
    sessionStorage.removeItem('user');
    this.loggedUser.set(null);
    this.tokenService.clearAccessToken();
  }

  logout() {
    this.removeLocalData();
    this.router.navigateByUrl("auth/login");
  }
}
