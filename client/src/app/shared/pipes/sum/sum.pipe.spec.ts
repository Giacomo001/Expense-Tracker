import { ExpenseRead } from '@features/expenses/models/expense.model';
import { SumPipe } from './sum.pipe';

describe('SumPipe', () => {
  let pipe: SumPipe;
  //Outside of the 'beforeEach' because the array never changes. If it did, the right place would be inside the 'beforeEach'
  const expensesList: ExpenseRead[] = 
  [
    {
      id: "1",
      categoryId: "cat-1",
      amount: 30,
      description: 'Description Test 1',
      date: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01'),
      categoryName: 'Category Test 1',
      categoryColor: '#000000'
    },
    {
      id: "2",
      categoryId: "cat-2",
      amount: 50,
      description: 'Description Test 2',
      date: new Date('2026-01-02'),
      createdAt: new Date('2026-01-02'),
      categoryName: 'Category Test 2',
      categoryColor: '#d3d3d3'
    },
    {
      id: "3",
      categoryId: "cat-2",
      amount: 20,
      description: 'Description Test 3',
      date: new Date('2026-01-05'),
      createdAt: new Date('2026-01-05'),
      categoryName: 'Category Test 2',
      categoryColor: '#d3d3d3'
    }
  ];

  beforeEach(() => {
    pipe = new SumPipe();
  });

  // ================================================
  // Expenses NULL / UNDEFINED / EMPTY ARRAY
  // ================================================
  describe('when expenses list is null, undefined or empty', () => {
    it('should return 0 when expenses is null', () => {
      expect(pipe.transform(null as unknown as ExpenseRead[])).toBe(0);
    });

    it('should return 0 when expenses is undefined', () => {
      expect(pipe.transform(undefined as unknown as ExpenseRead[])).toBe(0);
    });

    it('should return 0 when expenses is empty', () => {
      //Arrange
      const expenses: ExpenseRead[] = [];

      //Act + Assert
      expect(pipe.transform(expenses)).toBe(0);
    });
  });

  // ================================================
  // NO CATEGORY FILTER (categoryId not provided)
  // ================================================
  describe('when categoryId is not provided', () => {
    it('should return the sum of all expenses', () => {
      //Act
      const result = pipe.transform(expensesList);

      //Assert
      expect(result).toBe(100);
    });
  });

  // ================================================
  // WITH CATEGORY FILTER (categoryId provided)
  // ================================================
  describe('when categoryId is provided', () => {
    it('should return sum of matching expenses only', () => {
      //Arrange
      const categoryId = "cat-2";

      //Act
      const result = pipe.transform(expensesList, categoryId);

      //Assert
      expect(result).toBe(70);
    });

    it('should return 0 when no expenses match the categoryId', () => {
      //Arrange
      const categoryId = "cat-3";

      //Act
      const result = pipe.transform(expensesList, categoryId);

      //Assert
      expect(result).toBe(0);
    });
  });
});
