import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { TokenService } from '../token/token.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountService } from '../account/account.service';
import { environment } from '@env/environment';
import { AuthResponse } from '@features/auth/models/auth-response.model';
import { LoggedUser } from '@features/auth/models/logged-user.model';
import { provideHttpClient } from '@angular/common/http';
import { LoginRequest, RegisterRequest } from '@features/auth/models/auth-request.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenServiceMock: TokenService;
  let accountServiceMock: AccountService;

  const baseUrl = `${environment.apiUrl}/auth`;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token',
    userName: 'mock-username',
    email: 'mock-email'
  };

  const mockLoggedUser: LoggedUser = {
    userName: mockAuthResponse.userName,
    email: mockAuthResponse.email
  }

  beforeEach(() => {
    //No refresh token handling on the client anymore — the refresh token lives in an httpOnly cookie sent automatically via withCredentials.
    tokenServiceMock = {
      setAccessToken: jest.fn(),
      clearAccessToken: jest.fn(),
      hasAccessToken: jest.fn(),
      getAccessToken: jest.fn()
    } as unknown as jest.Mocked<TokenService>;

    accountServiceMock = {
      setLoggedUser: jest.fn(),
      logout: jest.fn()
    } as unknown as jest.Mocked<AccountService>;

    TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: TokenService, useValue: tokenServiceMock },
          { provide: AccountService, useValue: accountServiceMock }
        ]
      });

      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("Registration", () => {
    it("should send a POST request with the correct body and return AuthResponse", () => {
      const mockRegisterRequest: RegisterRequest = {
        userName: 'Test',
        email: 'test@test.test',
        password: 'Password test',
        confirmPassword: 'Password test'
      }

      service.registration(mockRegisterRequest).subscribe(res => {
        expect(res).toEqual(mockAuthResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRegisterRequest);
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockAuthResponse);
    });

    it("should save the access token and logged user after a successful registration", () => {
      const mockRegisterRequest: RegisterRequest = {
        userName: 'Test',
        email: 'test@test.test',
        password: 'Password test',
        confirmPassword: 'Password test'
      }

      service.registration(mockRegisterRequest).subscribe();
      httpMock.expectOne(`${baseUrl}/register`).flush(mockAuthResponse);

      //The refresh token is set as an httpOnly cookie by the backend — the client never touches it directly, so only the access token save is asserted here.
      expect(tokenServiceMock.setAccessToken).toHaveBeenCalledWith(mockAuthResponse.accessToken);
      expect(accountServiceMock.setLoggedUser).toHaveBeenCalledWith(mockLoggedUser);
    });
  });

  describe("Login", () => {
    it("should send a POST request with the correct body and return AuthResponse", () => {
      const mockLoginRequest: LoginRequest = {
        email: 'test@test.test',
        password: 'Password test'
      };

      service.login(mockLoginRequest).subscribe(res => {
        expect(res).toEqual(mockAuthResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockLoginRequest);
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockAuthResponse);
    });

    it("should save the access token and logged user after a successful login", () => {
      const mockLoginRequest: LoginRequest = {
        email: 'test@test.test',
        password: 'Password test'
      };

      service.login(mockLoginRequest).subscribe();
      httpMock.expectOne(`${baseUrl}/login`).flush(mockAuthResponse);

      expect(tokenServiceMock.setAccessToken).toHaveBeenCalledWith(mockAuthResponse.accessToken);
      expect(accountServiceMock.setLoggedUser).toHaveBeenCalledWith(mockLoggedUser);
    });
  });

  describe("Refresh", () => {
    it("should call POST with an empty body, relying on the httpOnly cookie", () => {
      service.refresh().subscribe(res => {
        expect(res).toEqual(mockAuthResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.withCredentials).toBe(true); //cookie is sent automatically

      req.flush(mockAuthResponse);
    });

    it("should save the access token and logged user after a successful refresh", () => {
      service.refresh().subscribe();
      httpMock.expectOne(`${baseUrl}/refresh`).flush(mockAuthResponse);

      expect(tokenServiceMock.setAccessToken).toHaveBeenCalledWith(mockAuthResponse.accessToken);
      expect(accountServiceMock.setLoggedUser).toHaveBeenCalledWith(mockLoggedUser);
    });
  });

  describe("Revoke", () => {
    it("should send a POST request with an empty body", () => {
      service.revoke().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/revoke`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.withCredentials).toBe(true);

      req.flush(null);

      expect(accountServiceMock.logout).toHaveBeenCalled();
    });

    it("should call accountService.logout() even when the request fails", () => {
      service.revoke().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${baseUrl}/revoke`);
      req.flush('server error', { status: 500, statusText: 'Internal Server Error' });

      //Covers the catchError branch — logout must still happen on failure
      expect(accountServiceMock.logout).toHaveBeenCalled();
    });
  });

  describe("logoutLocally", () => {
    it("should call accountService.logout() without any HTTP call", () => {
      service.logoutLocally();

      expect(accountServiceMock.logout).toHaveBeenCalled();
      httpMock.verify(); //No pending requests — confirms no HTTP call was made
    });
  });
});