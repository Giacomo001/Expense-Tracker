import { TestBed } from '@angular/core/testing';

import { AccountService } from './account.service';
import { Router } from '@angular/router';
import { TokenService } from '../token/token.service';
import { LoggedUser } from '@features/auth/models/logged-user.model';

describe('AccountService', () => {
  let service: AccountService;
  let routerMock: jest.Mocked<Router>;
  let tokenServiceMock: jest.Mocked<TokenService>;

  //Outside the 'describe' since it will never change
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
      clearTokens: jest.fn()
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
      //Since 'beforeEach' clears the sessionStorage, there is no need for the Arrange or Act part
      expect(service.loggedUser()).toBeNull();
    });

    it("should return the parsed LoggedUser when sessionStorage has data", () => {
      //Arrange
      sessionStorage.setItem('user', JSON.stringify(mockUser));

      //Recreates the TestBed AFTER the sessionStorage has been initialized
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AccountService,
          { provide: Router, useValue: routerMock },
          { provide: TokenService, useValue: tokenServiceMock }
        ]
      });     

      const freshService = TestBed.inject(AccountService);
      
      //Act + Assert
      expect(freshService.loggedUser()).toEqual(mockUser);
    });
  });

  describe("SetLoggedUser", () => {
    it("should store the user in the sessionStorage", () => {
      //Set the user
      service.setLoggedUser(mockUser);

      //Check if the user was stored correctly
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
      //Set the item in the SessionStorage
      sessionStorage.setItem('user', JSON.stringify(mockUser));

      //Removes it
      service.removeLocalData();
      expect(service.loggedUser()).toBeNull();
    });

    it("should set the signal to NULL", () => {
      service.setLoggedUser(mockUser);
      service.removeLocalData();
      expect(service.loggedUser()).toBeNull();
    });
  });

  describe("Logout", () => {
    it("should clear SessionStorage", () => {
      sessionStorage.setItem('user', JSON.stringify(mockUser));
      service.logout();
      expect(sessionStorage.getItem('user')).toBeNull();
    });

    it("should call tokenService.clearTokens()", () => {
      service.logout();
      expect(tokenServiceMock.clearTokens).toHaveBeenCalled();
    });

    it("should navigate to the login page", () => {
      service.logout();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('auth/login');
    });
  });
});
