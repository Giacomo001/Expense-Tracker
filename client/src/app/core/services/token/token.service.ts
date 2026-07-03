import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private _accessToken = signal<string | null>(null); //Private signal not saved anywhere

  getAccessToken() {
    return this._accessToken(); //Getter method
  }

  setAccessToken(token: string) {
    this._accessToken.set(token);
  }

  getRefreshToken(): string | null {
    //SessionStorage is better than LocalStorage since closing the browser deletes everything about it
    return sessionStorage.getItem('refreshToken');
  }

  setRefreshToken(token: string) {
    sessionStorage.setItem('refreshToken', token);
  }

  clearTokens(): void {
    this._accessToken.set(null);
    sessionStorage.removeItem('refreshToken');
  }

  //Method used by the AuthGuard to check if the User is logged in
  hasTokens(): boolean {
    return this._accessToken() !== null && this.getRefreshToken() !== null;
  }
}
