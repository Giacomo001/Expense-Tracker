import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { TokenService } from '../token/token.service';
import { LoginRequest, RegisterRequest } from '@features/auth/models/auth-request.model';
import { Observable, tap } from 'rxjs';
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
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, register).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  login(login: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, login).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();

    //{ refreshToken } because the backend expects a JSON object, not a simple string
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  revoke(): Observable<void> {
    const refreshToken = this.tokenService.getRefreshToken();
    
    return this.http.post<void>(`${this.baseUrl}/auth/revoke`, { refreshToken }).pipe(
      tap(() => this.accountService.logout())
    );
  }

  private handleAuthResponse(response: AuthResponse) {
    //Saves the tokens
    this.tokenService.setAccessToken(response.accessToken);
    this.tokenService.setRefreshToken(response.refreshToken);

    //Saves logged user
    const user: LoggedUser = {
      userName: response.userName,
      email: response.email
    };
    this.accountService.setLoggedUser(user);
  }
}
