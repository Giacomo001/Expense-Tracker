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

  clearAccessToken(): void {
    this._accessToken.set(null);
  }

  //Method used by the AuthGuard to check if the User is logged in
  hasAccessToken(): boolean {
    return this._accessToken() !== null;
  }
}
