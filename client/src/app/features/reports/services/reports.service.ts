import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface ReportPdfRequest {
  view: 'monthly' | 'annual' | 'category';
  year: number;
  month: number;
  chartImageBase64?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  exportPdf(request: ReportPdfRequest): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/reports/export`, request, {
      responseType: 'blob'
    });
  }
}