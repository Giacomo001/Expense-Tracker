import { TestBed } from '@angular/core/testing';

import { AccountService } from './account.service';
import { Router } from '@angular/router';
import { TokenService } from '../token/token.service';
import { LoggedUser } from '@features/auth/models/logged-user.model';

describe('AccountService', () => {
  let service: AccountService;
  let routerMock: jest.Mocked<Router>;
  let tokenServiceMock: jest.Mocked<TokenService>;

  const mockUser: LoggedUser = {
    userName: "UserTest",
    email: "test@test.test"
  }

  beforeEach(() => {
    sessionStorage.clear();

    routerMock = {
      navigateByUrl: jest.fn()
    } as unknown as jest.Mocked<Router>;

    tokenServiceMock = {
      clearAccessToken: jest.fn()
    } as unknown as jest.Mocked<TokenService>;

    TestBed.configureTestingModule({
      providers: [
        AccountService,
        { provide: Router, useValue: routerMock },
        { provide: TokenService, useValue: tokenServiceMock }
      ]
    });

    service = TestBed.inject(AccountService);
  });

  describe("LoadFromStorage", () => {
    it("should return null when sessionStorage is empty", () => {
      expect(service.loggedUser()).toBeNull();
    });

    it("should return the parsed LoggedUser when sessionStorage has data", () => {
      sessionStorage.setItem('user', JSON.stringify(mockUser));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AccountService,
          { provide: Router, useValue: routerMock },
          { provide: TokenService, useValue: tokenServiceMock }
        ]
      });

      const freshService = TestBed.inject(AccountService);

      expect(freshService.loggedUser()).toEqual(mockUser);
    });
  });

  describe("SetLoggedUser", () => {
    it("should store the user in the sessionStorage", () => {
      service.setLoggedUser(mockUser);

      const storedUser = JSON.parse(sessionStorage.getItem('user')!);
      expect(storedUser).toEqual(mockUser);
    });

    it("should update the signal", () => {
      service.setLoggedUser(mockUser);
      expect(service.loggedUser()).toEqual(mockUser);
    });
  });

  describe("RemoveLocalData", () => {
    it("should remove the data from SessionStorage", () => {
      sessionStorage.setItem('user', JSON.stringify(mockUser));

      service.removeLocalData();
      expect(service.loggedUser()).toBeNull();
    });

    it("should set the signal to NULL", () => {
      service.setLoggedUser(mockUser);
      service.removeLocalData();
      expect(service.loggedUser()).toBeNull();
    });

    it("should call tokenService.clearAccessToken()", () => {
      service.removeLocalData();
      expect(tokenServiceMock.clearAccessToken).toHaveBeenCalled();
    });
  });

  describe("Logout", () => {
    it("should clear SessionStorage", () => {
      sessionStorage.setItem('user', JSON.stringify(mockUser));
      service.logout();
      expect(sessionStorage.getItem('user')).toBeNull();
    });

    it("should call tokenService.clearAccessToken()", () => {
      service.logout();
      expect(tokenServiceMock.clearAccessToken).toHaveBeenCalled();
    });

    it("should navigate to the login page", () => {
      service.logout();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('auth/login');
    });
  });
});