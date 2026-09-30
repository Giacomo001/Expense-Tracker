import { TestBed } from '@angular/core/testing';

import { ReportPdfRequest, ReportsService } from './reports.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { provideHttpClient } from '@angular/common/http';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/reports/export`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("ExportPdf", () => {
    it("should send a POST request and return a 'blob' response", () => {
      //Arrange
      const mockRequest: ReportPdfRequest = {
        view: 'monthly',
        year: 2026,
        month: 1,
        chartImageBase64: undefined
      };

      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' }); //Mocking a proper Blob file
      
      //Act
      service.exportPdf(mockRequest).subscribe(res => {
        expect(res).toEqual(mockBlob);
      });
      
      //Assert
      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      expect(req.request.responseType).toBe('blob'); //Important check: MUST be a blob type

      //Simulate
      req.flush(mockBlob);
    });
  });
});
