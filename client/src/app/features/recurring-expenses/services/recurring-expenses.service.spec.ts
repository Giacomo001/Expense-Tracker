import { TestBed } from '@angular/core/testing';

import { RecurringExpensesService } from './recurring-expenses.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { provideHttpClient } from '@angular/common/http';
import { RecurringExpenseConfirm, RecurringExpenseCreate, RecurringExpenseDue, RecurringExpenseRead, RecurringExpenseUpdate } from '../models/recurring-expense.model';
import { Frequency } from '../models/frequency.enum';
import { ExpenseRead } from '@features/expenses/models/expense.model';

describe('RecurringExpenseService', () => {
  let service: RecurringExpensesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/recurringexpenses`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RecurringExpensesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("GetAllRecurringExpensesByUserId", () => {
    it("should send a GET request and return a list of RecurringExpenses", () => {
      //Arrange
      const mockRecurringExpensesList: RecurringExpenseRead[] = 
      [
        {
          id: "1",
          amount: 15,
          description: "Netflix subscription",
          frequency: Frequency.Monthly,
          nextDueDate: "2026-02-01",
          categoryId: "cat-1",
          categoryName: "Hobbies",
          categoryColor: "#000000"
        },
        {
          id: "2",
          amount: 800,
          description: "Rent",
          frequency: Frequency.Monthly,
          nextDueDate: "2026-02-01",
          categoryId: "cat-2",
          categoryName: "Rent",
          categoryColor: "#AEAEAE"
        }
      ];
    
      //Act
      service.getAllRecurringExpensesByUserId().subscribe(res => {
        expect(res).toEqual(mockRecurringExpensesList);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('GET');
      
      //Simulate
      req.flush(mockRecurringExpensesList);
    });
  });

  describe("GetDueRecurringExpensesByUserId", () => {
    it("should send a GET request andreturn a list of the due RecurringExpense", () => {
      //Arrange
      const mockRecurringExpensesDueList: RecurringExpenseDue[] = 
      [
        {
          id: "1",
          amount: 15,
          description: "Netflix subscription",
          frequency: Frequency.Monthly,
          categoryId: "cat-1",
          categoryName: "Hobbies",
          categoryColor: "#000000"
        }
      ];
      
      //Act
      service.getDueRecurringExpensesByUserId().subscribe(res => {
        expect(res).toEqual(mockRecurringExpensesDueList);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/due`);
      expect(req.request.method).toBe('GET');
      
      //Simulate
      req.flush(mockRecurringExpensesDueList);
    });
  });

  describe("GetRecurringExpenseById", () => {
    it("should send a GET request and return a specific RecurringExpense", () => {
      //Arrange
      const recurringExpenseId: string = "1";
      const mockRecurringExpense: RecurringExpenseRead =
      {
        id: "1",
        amount: 15,
        description: "Netflix subscription",
        frequency: Frequency.Monthly,
        nextDueDate: "2026-02-01",
        categoryId: "cat-1",
        categoryName: "Hobbies",
        categoryColor: "#000000"
      };
      
      //Act
      service.getRecurringExpenseById(recurringExpenseId).subscribe(res => {
        expect(res).toEqual(mockRecurringExpense);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${recurringExpenseId}`);
      expect(req.request.method).toBe('GET');
      
      //Simulate
      req.flush(mockRecurringExpense);      
    });
  });

  describe("CreateRecurringExpense", () => {
    it("should send a POST request with the right body and return the created record", () => {
      //Arrange
      const mockRecurringExpenseCreate: RecurringExpenseCreate = 
      {
        amount: 15,
        description: "Netflix subscription",
        frequency: Frequency.Monthly,
        startDate: new Date('2026-01-15'),
        categoryId: "cat-1"
      };

      const mockRecurringExpense: RecurringExpenseRead =
      {
        id: "1",
        amount: 15,
        description: "Netflix subscription",
        frequency: Frequency.Monthly,
        nextDueDate: "2026-02-15",
        categoryId: "cat-1",
        categoryName: "Hobbies",
        categoryColor: "#000000"
      };
      
      //Act
      service.createRecurringExpense(mockRecurringExpenseCreate).subscribe(res => {
        expect(res).toEqual(mockRecurringExpense);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRecurringExpenseCreate);
      
      //Simulate
      req.flush(mockRecurringExpense);      
    });
  });

  describe("UpdateRecurringExpense", () => {
    it("should send a PUT request with the right body and return the updated record", () => {
      //Arrange
      const recurringExpenseId: string = "1";
      const mockRecurringExpenseUpdate: RecurringExpenseUpdate = 
      {
        amount: 18,
        description: "Netflix Premium subscription",
        frequency: Frequency.Monthly
      };

      const mockRecurringExpense: RecurringExpenseRead =
      {
        id: "1",
        amount: 18,
        description: "Netflix Premium subscription",
        frequency: Frequency.Monthly,
        nextDueDate: "2026-02-01",
        categoryId: "cat-1",
        categoryName: "Hobbies",
        categoryColor: "#000000"
      };
      
      //Act
      service.updateRecurringExpense(recurringExpenseId, mockRecurringExpenseUpdate).subscribe(res => {
        expect(res).toEqual(mockRecurringExpense);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${recurringExpenseId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockRecurringExpenseUpdate);
      
      //Simulate
      req.flush(mockRecurringExpense);     
    });
  });

  describe("DeleteRecurringExpense", () => {
    it("should send a DELETE request and return void", () => {
      //Arrange
      const recurringExpenseId = "1";
      
      //Act
      service.deleteRecurringExpense(recurringExpenseId).subscribe(res => {
        expect(res).toBeUndefined();
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${recurringExpenseId}`);
      expect(req.request.method).toBe('DELETE');
      
      //Simulate
      req.flush(null);      
    });
  });

  describe("ConfirmRecurringExpense", () => {
    it("should send a POST request with the right body and return the Expenses created", () => {
      //Arrange
      const recurringExpenseId: string = "1";
      const mockRecurringExpenseConfirm: RecurringExpenseConfirm = 
      {
        amount: 15,
        description: "Netflix subscription",
        updateTemplate: false
      };

      const mockExpenseRead: ExpenseRead = 
      {
        id: "1",
        amount: 15,
        description: "Netflix subscription",
        date: new Date('2026-01-15'),
        createdAt: new Date('2026-01-15'),
        categoryId: "cat-1",
        categoryName: "Name Test",
        categoryColor: "#000000"
      };
      
      //Act
      service.confirmRecurringExpense(recurringExpenseId, mockRecurringExpenseConfirm).subscribe(res => {
        expect(res).toEqual(mockExpenseRead);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${recurringExpenseId}/confirm`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRecurringExpenseConfirm);
      
      //Simulate
      req.flush(mockExpenseRead);      
    });
  });

  describe("SkipRecurringExpense", () => {
    it("should send a POST request to skip the recurring expense and return void", () => {
      //Arrange
      const recurringExpenseId: string = "1";
      
      //Act
      service.skipRecurringExpense(recurringExpenseId).subscribe(res => {
        expect(res).toBeUndefined();
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${recurringExpenseId}/skip`);
      expect(req.request.method).toBe('POST');
      
      //Simulate
      req.flush(null);      
    });
  });

  describe("StopRecurringExpense", () => {
    it("should send a POST request to stop the recurring expense and return void", () => {
      //Arrange
      const recurringExpenseId: string = "1";
      
      //Act
      service.stopRecurringExpense(recurringExpenseId).subscribe(res => {
        expect(res).toBeUndefined();
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${recurringExpenseId}/stop`);
      expect(req.request.method).toBe('POST');
      
      //Simulate
      req.flush(null);      
    });
  });
});
