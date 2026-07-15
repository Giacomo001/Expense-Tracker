import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { TokenService } from '../token/token.service';
import { LoginRequest, RegisterRequest } from '@features/auth/models/auth-request.model';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuthResponse } from '@features/auth/models/auth-response.model';
import { LoggedUser } from '@features/auth/models/logged-user.model';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private accountService = inject(AccountService);
  private tokenService = inject(TokenService);
  private baseUrl = environment.apiUrl;

  registration(register: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, register, { withCredentials: true }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  login(login: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, login, { withCredentials: true }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  refresh(): Observable<AuthResponse> {
    //{ refreshToken } because the backend expects a JSON object, not a simple string
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  revoke(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/revoke`, {}, { withCredentials: true }).pipe(
      tap(() => this.accountService.logout()),
      catchError(err => {
        this.accountService.logout();
        return throwError(() => err);
      })
    );
  }

  private handleAuthResponse(response: AuthResponse) {
    //The RefreshToken is already saved as cookie HttpOnly in the response
    this.tokenService.setAccessToken(response.accessToken);

    //Saves logged user
    const user: LoggedUser = {
      userName: response.userName,
      email: response.email
    };
    this.accountService.setLoggedUser(user);
  }

  logoutLocally(): void {
    //Local clean-up without a HTTP call. Used by the Interceptor when refresh does not work
    this.accountService.logout();
  }
}
