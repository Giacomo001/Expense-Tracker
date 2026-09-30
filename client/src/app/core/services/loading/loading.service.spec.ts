import { TestBed } from '@angular/core/testing';

import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    service = new LoadingService();
  });

  // ================================================
  // Show
  // ================================================
  describe("show", () => {
    it("should set isBarLoading to true when called with default key", () => {      
      //Act
      //Gets called with the default value
      service.show();
      
      //Assert
      expect(service.isBarLoading()).toBe(true);
    });

    it("should set the specific key to true when called with a custom key", () => {
      //Act
      //Parameter is custom
      service.show('expenses');
      
      //Assert
      expect(service.isLoading('expenses')()).toBe(true);
      expect(service.isBarLoading()).toBe(false);
    });

    it("should keep multiple keys active at the same time without conflicts", () => {      
      //Act
      //Multiple parameters
      service.show('bar');
      service.show('expenses');
      
      //Assert
      expect(service.isBarLoading()).toBe(true);
      expect(service.isLoading('expenses')()).toBe(true);
    });
  });

  // ================================================
  // Hide
  // ================================================
  describe("Hide", () => {
    it("should set isBarLoading to false after hiding the default key", () => {
      //Arrange
      service.show();
      
      //Act
      service.hide();
      
      //Assert
      expect(service.isBarLoading()).toBe(false);
    });

    it("should set the specific key to false after hiding a custom key", () => {
      //Arrange
      service.show('expenses');
      
      //Act
      service.hide('expenses')      
      
      //Assert
      expect(service.isBarLoading()).toBe(false);
    });

    it("should not throw when hiding a key that does not exist", () => {
      //Assert
      //It won't throw an error if the parameter is non existent
      expect(() => service.hide('nonexistent')).not.toThrow();
    });
  });
});
