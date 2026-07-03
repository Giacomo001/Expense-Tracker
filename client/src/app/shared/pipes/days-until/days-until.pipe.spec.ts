import { DaysUntilPipe } from './days-until.pipe';

describe('DaysUntilPipe', () => {
  //Instance that will be used throughout the test
  let pipe: DaysUntilPipe;

  //'beforeEach()' runs before every test
  //It creates a new pipe instance every time so each test won't interfere with another
  beforeEach(() => {
    pipe = new DaysUntilPipe();
  });

  // ================================================
  // NULL / UNDEFINED / EMPTY — edge cases
  // ================================================
  describe('when date is null, undefined or empty', () => {
    it('should return null when date is null', () => {
      expect(pipe.transform(null)).toBeNull();
    });

    it('should return null when date is undefined', () => {
      expect(pipe.transform(undefined)).toBeNull();
    });

    it('should return null when date is empty string', () => {
      expect(pipe.transform('')).toBeNull();
    });
  });

  // ================================================
  // TODAY
  // ================================================
  describe('when date is today', () => {
    it('should return 0', () => {
      //Arrange
      const today = new Date();
      const isoDate = today.toISOString().split('T')[0];

      //Act
      var result = pipe.transform(isoDate);

      //Assert
      expect(result).toBe(0);
    })
  });

  // ================================================
  // FUTURE DATES
  // ================================================
  describe('when date is in the future', () => {
    it('should return 1 when date is tomorrow', () => {
      //Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isoDate = tomorrow.toISOString().split('T')[0];

      //Act + Assert
      expect(pipe.transform(isoDate)).toBe(1);
    });

    it('it should return 7 when date is 7 days from now', () => {
      //Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const isoDate = futureDate.toISOString().split('T')[0];

      //Act + Assert
      expect(pipe.transform(isoDate)).toBe(7);
    });

    it('it should return 30 when date is 30 days from now', () => {
      //Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const isoDate = futureDate.toISOString().split('T')[0];

      //Act + Assert
      expect(pipe.transform(isoDate)).toBe(30);
    });
  });

  // ================================================
  // PAST DATES
  // ================================================
  describe('when date is in the past', () => {
    it('should return -1 when date was yesterday', () => {
      //Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const isoDate = pastDate.toISOString().split('T')[0];

      //Act + Assert
      expect(pipe.transform(isoDate)).toBe(-1);
    });

    it('should return negative number when date is in the past', () => {
      //Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 15);

      const isoDate = pastDate.toISOString().split('T')[0];

      //Act + Assert
      expect(pipe.transform(isoDate)).toBe(-15);
    });
  });
});
