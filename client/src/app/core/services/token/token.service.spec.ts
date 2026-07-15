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
    it('should return false when both tokens are missing', () => {
      expect(service.hasAccessToken()).toBe(false);
    });

    it('should return false when only accessToken is set', () => {
      service.setAccessToken('mock-access-token');
      expect(service.hasAccessToken()).toBe(false);
    });

    it('should return false when only refreshToken is set', () => {
      expect(service.hasAccessToken()).toBe(false);
    });

    it('should return true when both tokens are set', () => {
      service.setAccessToken('mock-access-token');
      expect(service.hasAccessToken()).toBe(true);
    });
  });
});
