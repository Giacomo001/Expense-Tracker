import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';

import { CategoriesService } from './categories.service';
import { provideHttpClient } from '@angular/common/http';
import { CategoryCreate, CategoryRead, CategoryUpdate } from '../models/category.model';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/categories`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), //Provides a real HttpClient
        provideHttpClientTesting() //Intercepts and fakes the actual requests
      ]
    });

    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  //Verifies no unexpected/unhandled requests are left after each test
  afterEach(() => {
    httpMock.verify();
  });

  describe('GetCategories', () => {
    it('should send a GET request and return the list of Categories', () => {
      //Arrange
      const mockCategories: CategoryRead[] = [
        { id: "1", name: "Category 1", color: "#000000" },
        { id: "2", name: "Category 2", color: "#AFAFAF" }
      ];

      //Act
      service.getCategories().subscribe(res => {
        expect(res).toEqual(mockCategories);
      });

      //Assert
      //Check the http call
      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('GET');

      //Simulate
      req.flush(mockCategories);
    });
  });

  describe('GetCategoryById', () => {
    it('should send a GET request and return the specific record', () => {
      //Arrange
      const mockCategory: CategoryRead = { id: "1", name: "Category 1", color: "#000000" };
      const categoryId: string = "1";

      //Act
      service.getCategoryById(categoryId).subscribe(res => {
        expect(res).toEqual(mockCategory);
      });

      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${categoryId}`);
      expect(req.request.method).toBe('GET');

      //Simulate
      req.flush(mockCategory);
    });
  });

  describe('CreateCategory', () => {
    it('should send a POST request with the correct body and return the created record', () => {
      //Arrange
      const mockCategoryCreate: CategoryCreate = { name: "Category Test"};
      const mockCategoryRead: CategoryRead = { id: "1", name: "Category Test", color: "#000000" };
  
      //Act
      service.createCategory(mockCategoryCreate).subscribe(res => {
        expect(res).toEqual(mockCategoryRead);
      });
  
      //Assert
      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCategoryCreate);
  
      //Simulate
      req.flush(mockCategoryRead);
    });
  });

  describe('UpdateCategory', () => {
    it('should send a PUT request with the correct body, the specific CategoryId and return the updated record', () => {
      //Arrange
      const mockCategoryRead: CategoryRead = {id: "2", name:"Category New Name", color: "#000000"};
      const mockCategoryUpdate: CategoryUpdate = { name: "Category New Name" };
      const mockCategoryId: string = "2";
      
      //Act
      service.updateCategory(mockCategoryId, mockCategoryUpdate).subscribe(res => {
        expect(res).toEqual(mockCategoryRead);
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${mockCategoryId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockCategoryUpdate);
      
      //Simulate      
      req.flush(mockCategoryRead);
    });
  });

  describe('DeleteCategory', () => {
    it('should send a DELETE request and return void', () => {
      //Arrange
      const mockCategoryId: string = "2";

      //Act
      service.deleteCategory(mockCategoryId).subscribe(res => {
        expect(res).toBeUndefined();
      });
      
      //Assert
      const req = httpMock.expectOne(`${baseUrl}/${mockCategoryId}`);
      expect(req.request.method).toBe('DELETE');
      
      //Simulate
      req.flush(null);
    });
  });
});
