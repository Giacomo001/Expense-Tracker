import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment.development';
import { LoggedUser } from '@features/auth/models/logged-user.model';
import { TokenService } from '../token/token.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private baseUrl = environment.apiUrl;

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
  }

  logout() {
    this.removeLocalData();
    this.tokenService.clearTokens();

    this.router.navigateByUrl("auth/login");
  }
}
