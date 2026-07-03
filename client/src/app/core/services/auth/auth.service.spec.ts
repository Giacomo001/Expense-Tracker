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

  //Reusable mock data
  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    userName: 'mock-username',
    email: 'mock-email'
  };

  const mockLoggedUser: LoggedUser = {
    userName: mockAuthResponse.userName,
    email: mockAuthResponse.email
  }

  beforeEach(() => {
    tokenServiceMock = {
      setAccessToken: jest.fn(),
      setRefreshToken: jest.fn(),
      getRefreshToken: jest.fn().mockReturnValue('mock-refresh-token')
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
      //Arrange
      const mockRegisterRequest: RegisterRequest = {
        userName: 'Test',
        email: 'test@test.test',
        password: 'Password test',
        confirmPassword: 'Password test'
      }
      
      //Act
      service.registration(mockRegisterRequest).subscribe(res => {
        expect(res).toEqual(mockAuthResponse);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRegisterRequest);
      
      //Simulate
      req.flush(mockAuthResponse);
    });

    //Takes care of the 'tap()'
    it("should save tokens and logged user after a successful registration", () => {
      //Arrange
      const mockRegisterRequest: RegisterRequest = {
        userName: 'Test',
        email: 'test@test.test',
        password: 'Password test',
        confirmPassword: 'Password test'
      }
      
      //Act
      service.registration(mockRegisterRequest).subscribe();
      httpMock.expectOne(`${baseUrl}/register`).flush(mockAuthResponse);
      
      //Assert
      //Since handleAuthResponse is a private method, only its side effects can be checked
      expect(tokenServiceMock.setAccessToken).toHaveBeenCalledWith(mockAuthResponse.accessToken);
      expect(tokenServiceMock.setRefreshToken).toHaveBeenCalledWith(mockAuthResponse.refreshToken);
      expect(accountServiceMock.setLoggedUser).toHaveBeenCalledWith(mockLoggedUser);      
    });
  });

  describe("Login", () => {
    it("should send a POST request with the correct body and return AuthResponse", () => {
      //Arrange
      const mockLoginRequest: LoginRequest = {
        email: 'test@test.test',
        password: 'Password test'
      };
      
      //Act
      service.login(mockLoginRequest).subscribe(res => {
        expect(res).toEqual(mockAuthResponse);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockLoginRequest);
      
      //Simulate
      req.flush(mockAuthResponse);
    });

    it("should save tokens and logged user after a successful login", () => {
      //Arrange
      const mockLoginRequest: LoginRequest = {
        email: 'test@test.test',
        password: 'Password test'
      };
      
      //Act
      service.login(mockLoginRequest).subscribe();
      httpMock.expectOne(`${baseUrl}/login`).flush(mockAuthResponse);
      
      //Assert
      expect(tokenServiceMock.setAccessToken).toHaveBeenCalledWith(mockAuthResponse.accessToken);
      expect(tokenServiceMock.setRefreshToken).toHaveBeenCalledWith(mockAuthResponse.refreshToken);
      expect(accountServiceMock.setLoggedUser).toHaveBeenCalledWith(mockLoggedUser);
    });
  });

  describe("Refresh", () => {
    it("should call a POST method with the correct body and return AuthResponse", () => {
      //Arrange
      //GetRefreshToken is mocked already
      
      //Act
      service.refresh().subscribe(res => {
        expect(res).toEqual(mockAuthResponse);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token' })
      
      //Simulate
      req.flush(mockAuthResponse);
    });

    it("should save tokens and logged user after a successful token refresh", () => {
      //Arrange

      //Act
      service.refresh().subscribe();
      httpMock.expectOne(`${baseUrl}/refresh`).flush(mockAuthResponse);
      
      //Assert
      expect(tokenServiceMock.getRefreshToken).toHaveBeenCalled();
      expect(tokenServiceMock.setAccessToken).toHaveBeenCalledWith(mockAuthResponse.accessToken);
      expect(tokenServiceMock.setRefreshToken).toHaveBeenCalledWith(mockAuthResponse.refreshToken);
      expect(accountServiceMock.setLoggedUser).toHaveBeenCalledWith(mockLoggedUser);
    });
  });

  describe("Revoke", () => {
    it("should send a POST request with the correct body and remove data from sessionStorage and signal", () => {
      //Act
      service.revoke().subscribe();
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/revoke`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token' });
      
      //Simulate
      req.flush(null);

      //Side Effects
      expect(tokenServiceMock.getRefreshToken).toHaveBeenCalled();
      expect(accountServiceMock.logout).toHaveBeenCalled();
    });
  });
});
