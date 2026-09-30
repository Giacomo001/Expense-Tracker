import { TestBed } from '@angular/core/testing';

import { ExpensesService } from './expenses.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { provideHttpClient } from '@angular/common/http';
import { ExpenseCreate, ExpenseRead, ExpenseUpdate } from '../models/expense.model';
import { Frequency } from '@features/recurring-expenses/models/frequency.enum';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/expenses`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ExpensesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("GetExpenses", () => {
    it("should send a GET request and return a list of Expenses", () => {
      //Arrange
      const mockExpensesList: ExpenseRead[] = 
      [
        {
          id: "1",
          amount: 20,
          description: "Expense Description",
          date: new Date('2026-01-15'),
          createdAt: new Date('2026-01-15'),
          categoryId: "cat-1",
          categoryName: "Name Test",
          categoryColor: "#000000"
        },
        {
          id: "2",
          amount: 50,
          description: "Expense Description 2",
          date: new Date('2026-01-20'),
          createdAt: new Date('2026-01-20'),
          categoryId: "cat-2",
          categoryName: "Name Test 2",
          categoryColor: "#AEAEAE"
        }
      ];
      
      //Act
      service.getExpenses().subscribe(res => {
        expect(res).toEqual(mockExpensesList);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('GET');
      
      //Simulate
      req.flush(mockExpensesList);      
    });
  });

  describe("GetExpenseById", () => {
    it("should send a GET request and return the specific expense", () => {
      //Arrange
      const expenseId: string = "1";
      const mockExpenseRead: ExpenseRead = 
      {
        id: "1",
        amount: 20,
        description: "Expense Description",
        date: new Date('2026-01-15'),
        createdAt: new Date('2026-01-15'),
        categoryId: "cat-1",
        categoryName: "Name Test",
        categoryColor: "#000000"
      };
      
      //Act
      service.getExpenseById(expenseId).subscribe(res => {
        expect(res).toEqual(mockExpenseRead);
      })
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${expenseId}`);
      expect(req.request.method).toBe('GET');
      
      //Simulate
      req.flush(mockExpenseRead);
    });
  });

  describe("CreateExpense", () => {
    it("should send a POST request with the correct body and return the created record", () => {
      //Arrange
      const mockExpenseRead: ExpenseRead = 
      {
        id: "1",
        amount: 20,
        description: "Expense Description",
        date: new Date('2026-01-24'),
        createdAt: new Date('2026-01-24'),
        categoryId: "cat-2",
        categoryName: "Name Test",
        categoryColor: "#000000"
      };

      const mockExpenseCreate: ExpenseCreate = 
      {
        amount: 20,
        description: "Expense Description",
        date: new Date('2026-01-24'),
        categoryId: "cat-2",
        frequency: Frequency.Monthly
      }
      
      //Act
      service.createExpense(mockExpenseCreate).subscribe(res => {
        expect(res).toEqual(mockExpenseRead);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockExpenseCreate);
      
      //Simulate
      req.flush(mockExpenseRead);
    });
  });

  describe("UpdateExpense", () => {
    it("should send a PUT request with the correct body, the expenseId and return the updated record ", () => {
      //Arrange
      const expenseId: string = "1";
      const mockExpenseRead: ExpenseRead = 
      {
        id: "1",
        amount: 20,
        description: "Expense Description",
        date: new Date('2026-01-24'),
        createdAt: new Date('2026-01-15'),
        categoryId: "cat-2",
        categoryName: "Name Test",
        categoryColor: "#000000"
      };

      const mockExpenseUpdate: ExpenseUpdate = 
      {
        amount: 20,
        description: "Expense Description",
        date: new Date('2026-01-24'),
        categoryId: "cat-2"
      }
      
      //Act
      service.updateExpense(expenseId, mockExpenseUpdate).subscribe(res => {
        expect(res).toEqual(mockExpenseRead);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${expenseId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockExpenseUpdate);
      
      //Simulate
      req.flush(mockExpenseRead);
    });
  });

  describe("DeleteExpense", () => {
    it("should send a DELETE request and return void", () => {
      //Arrange
      const expenseId: string = "1";
      
      //Act
      service.deleteExpense(expenseId).subscribe(res => {
        expect(res).toBeUndefined();
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${expenseId}`);
      expect(req.request.method).toBe('DELETE');
      
      //Simulate
      req.flush(null);
    });
  });
});
