import { TestBed } from '@angular/core/testing';

import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    sessionStorage.clear();
    service = new TokenService();
  });

  // ================================================
  // getAccessToken
  // ================================================
  describe('getAccessToken', () => {
    it('should return null initially', () => {
      expect(service.getAccessToken()).toBeNull();
    });

    it('should return the token after setAccessToken is called', () => {
      service.setAccessToken('mock-access-token');
      expect(service.getAccessToken()).toBe('mock-access-token');
    });
  });

  // ================================================
  // setAccessToken
  // ================================================
  describe('setAccessToken', () => {
    it('should update the access token signal', () => {
      service.setAccessToken('mock-access-token');
      expect(service.getAccessToken()).toBe('mock-access-token');
    });
  });

  // ================================================
  // clearAccessToken
  // ================================================
  describe('clearAccessToken', () => {
    it('should set the access token signal to null', () => {
      //Arrange
      //Set a token first so we can verify it gets cleared
      service.setAccessToken('mock-access-token');

      service.clearAccessToken();

      expect(service.getAccessToken()).toBeNull();
    });
  });

  // ================================================
  // hasAccessToken
  // ================================================
  describe('hasAccessToken', () => {
    it('should return false when there is no access token', () => {
        expect(service.hasAccessToken()).toBe(false);
    });

    it('should return true when the access token is set', () => {
        service.setAccessToken('mock-access-token');
        expect(service.hasAccessToken()).toBe(true);
    });

    it('should return false again after the token is cleared', () => {
        service.setAccessToken('mock-access-token');
        service.clearAccessToken();
        expect(service.hasAccessToken()).toBe(false);
    });
  });
});
