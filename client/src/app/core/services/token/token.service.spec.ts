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
  // getRefreshToken
  // ================================================
  describe('getRefreshToken', () => {
    it('should return null when sessionStorage is empty', () => {
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should return the token after setRefreshToken is called', () => {
      service.setRefreshToken('mock-refresh-token');
      expect(service.getRefreshToken()).toBe('mock-refresh-token');
    });
  });

  // ================================================
  // setRefreshToken
  // ================================================
  describe('setRefreshToken', () => {
    it('should store the refresh token in sessionStorage', () => {
      service.setRefreshToken('mock-refresh-token');
      expect(sessionStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    });
  });

  // ================================================
  // clearTokens
  // ================================================
  describe('clearTokens', () => {
    it('should set the access token signal to null', () => {
      //Arrange
      //Set a token first so we can verify it gets cleared
      service.setAccessToken('mock-access-token');

      service.clearTokens();

      expect(service.getAccessToken()).toBeNull();
    });

    it('should remove the refresh token from sessionStorage', () => {
      //Arrange
      service.setRefreshToken('mock-refresh-token');

      service.clearTokens();

      expect(sessionStorage.getItem('refreshToken')).toBeNull();
    });
  });

  // ================================================
  // hasTokens
  // ================================================
  describe('hasTokens', () => {
    it('should return false when both tokens are missing', () => {
      expect(service.hasTokens()).toBe(false);
    });

    it('should return false when only accessToken is set', () => {
      service.setAccessToken('mock-access-token');
      expect(service.hasTokens()).toBe(false);
    });

    it('should return false when only refreshToken is set', () => {
      service.setRefreshToken('mock-refresh-token');
      expect(service.hasTokens()).toBe(false);
    });

    it('should return true when both tokens are set', () => {
      service.setAccessToken('mock-access-token');
      service.setRefreshToken('mock-refresh-token');
      expect(service.hasTokens()).toBe(true);
    });
  });
});
