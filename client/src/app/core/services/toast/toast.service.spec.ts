import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

describe('ToastService', () => {
  let service: ToastService;
  let toastrMock: ToastrService;

  //Fake Id returned by toastr.info()
  const mockToastId = 1;

  beforeEach(() => {
    //All toastrService methods are mocked
    toastrMock = {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn().mockReturnValue({ toastId: mockToastId }),
      remove: jest.fn()
    } as unknown as jest.Mocked<ToastrService>;

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: ToastrService, useValue: toastrMock }
      ]
    });

    service = TestBed.inject(ToastService);
  });

  describe('loading', () => {
    it('should remove the loading toast and call success on successful Observable', () => {
      //Arrange
      //of() creates an Observable that immediately emits a value and completes
      const source$ = of('result');

      //Act
      //Subscribe to trigger the pipe
      service.loading(source$, {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Error!'
      }).subscribe();

      //Assert
      //remove() should be called with the toast id returned by info()
      expect(toastrMock.remove).toHaveBeenCalledWith(mockToastId);
      expect(toastrMock.success).toHaveBeenCalled();
      expect(toastrMock.error).not.toHaveBeenCalled();
    });

    it('should remove the loading toast and call error with a string message on failed Observable', () => {
      //Arrange 
      //throwError() creates an Observable that immediately errors
      const source$ = throwError(() => new Error('API error'));

      //Act
      //catchError inside loading() prevents the error from propagating to Jest
      service.loading(source$, {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Something went wrong'
      }).subscribe({ error: () => {} }); //empty error handler to prevent unhandled error

      //Assert
      expect(toastrMock.remove).toHaveBeenCalledWith(mockToastId);
      expect(toastrMock.error).toHaveBeenCalled();
      expect(toastrMock.success).not.toHaveBeenCalled();
    });

    it('should call error with the result of the error function when error message is a function', () => {
      //Arrange
      const mockError = new Error('API error');
      const source$ = throwError(() => mockError);

      //The error message is a function that receives the error and returns a string
      //This tests the ternary: typeof messages.error === 'function' ? messages.error(err) : messages.error
      const errorFn = jest.fn().mockReturnValue('Dynamic error message');

      //Act
      service.loading(source$, {
        loading: 'Loading...',
        success: 'Done!',
        error: errorFn
      }).subscribe({ error: () => {} });

      //Assert
      //Verify the function was called with the actual error
      expect(errorFn).toHaveBeenCalledWith(mockError);
      expect(toastrMock.error).toHaveBeenCalled();
    });
  });
});
