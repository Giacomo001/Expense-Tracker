import { TestBed } from '@angular/core/testing';

import { BudgetsService } from './budgets.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { provideHttpClient } from '@angular/common/http';
import { BudgetCreate, BudgetRead, BudgetUpdate } from '../models/budget.model';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/budgets`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(BudgetsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('GetBudgetByUserId', () => {
    it('should send a GET request and return a list of Budgets', () => {
      //Arrange
      const mockBudgetList: BudgetRead[] = [
        {
          id: "1",
          amount: 25,
          categoryId: "cat-1",
          categoryName: "Name Test",
          categoryColor: "#000000"
        },
        {
          id: "2",
          amount: 10,
          categoryId: "cat-2",
          categoryName: "Name Test 2",
          categoryColor: "#ADADAD"
        }
      ];
      
      //Act
      service.getBudgetsByUserId().subscribe(res => {
        expect(res).toEqual(mockBudgetList);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('GET');
      
      //Simulate
      req.flush(mockBudgetList);      
    });
  });

  describe('GetBudgetById', () => {
    it('should send a GET request and return the specific budget', () => {
      //Arrange
      const budgetId: string = "1";
      const mockBudgetRead: BudgetRead =
      {
        id: "1",
        amount: 25,
        categoryId: "cat-1",
        categoryName: "Name Test",
        categoryColor: "#000000"
      };
      
      //Act
      service.getBudgetById(budgetId).subscribe(res => {
        expect(res).toEqual(mockBudgetRead)
      });

      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${budgetId}`);
      expect(req.request.method).toBe('GET');
      
      //Simulate
      req.flush(mockBudgetRead);      
    });
  });

  describe('GetBudgetByCategoryId', () => {
    it('should send a GET request and return a budget using the CategoryId', () => {
      //Arrange
      const categoryId: string = "cat-1";
      const mockBudgetRead: BudgetRead = 
      {
        id: "1",
        amount: 25,
        categoryId: "cat-1",
        categoryName: "Name Test",
        categoryColor: "#000000"
      };
      
      //Act
      service.getBudgetByCategoryId(categoryId).subscribe(res => {
        expect(res).toEqual(mockBudgetRead);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/category/${categoryId}`);
      expect(req.request.method).toBe('GET');

      //Simulate
      req.flush(mockBudgetRead);
    });
  });

  describe('CreateBudget', () => {
    it('should send a POST request with the correct body and return the created record', () => {
      //Arrange
      const mockBudgetCreate: BudgetCreate = { amount: 50, categoryId: "cat-3" };
      const mockBudgetRead: BudgetRead =
      {
        id: "1",
        amount: 50,
        categoryId: "cat-3",
        categoryName: "Name Test 3",
        categoryColor: "#ADADAD"
      };
      
      //Act
      service.createBudget(mockBudgetCreate).subscribe(res => {
        expect(res).toEqual(mockBudgetRead);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockBudgetCreate);
      
      //Simulate
      req.flush(mockBudgetRead);      
    });
  });

  describe('UpdateBudget', () => {
    it('should send a PUT request with the correct body, the specific BudgetId and return the updated record', () => {
      //Arrange
      const budgetId: string = "1";
      const mockBudgetUpdate: BudgetUpdate = { amount: 25 };
      const mockBudgetRead: BudgetRead =
      {
        id: "1",
        amount: 25,
        categoryId: "cat-1",
        categoryName: "Name Test",
        categoryColor: "#000000"
      };
      
      //Act
      service.updateBudget(budgetId, mockBudgetUpdate).subscribe(res => {
        expect(res).toEqual(mockBudgetRead);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${budgetId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockBudgetUpdate);
      
      //Simulate
      req.flush(mockBudgetRead);      
    });
  });

  describe('DeleteBudget', () => {
    it('should send a DELETE request and return void', () => {
      //Arrange
      const budgetId: string = "1";
      
      //Act
      service.deleteBudget(budgetId).subscribe(res => {
        expect(res).toBeUndefined();
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${budgetId}`);
      expect(req.request.method).toBe('DELETE');
      
      //Simulate
      req.flush(null);      
    });
  });
});
