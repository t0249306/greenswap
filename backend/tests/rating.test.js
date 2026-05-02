const { calculateNewRating } = require('../utils/rating');

describe('Rating Calculation', () => {
  it('should calculate initial rating correctly', () => {
    const result = calculateNewRating(0, 0, 5);
    expect(result.newRating).toBe(5);
    expect(result.newReviewsCount).toBe(1);
  });

  it('should calculate average rating correctly', () => {
    const result = calculateNewRating(4, 1, 5);
    expect(result.newRating).toBe(4.5);
    expect(result.newReviewsCount).toBe(2);
  });

  it('should throw error for invalid score', () => {
    expect(() => calculateNewRating(4, 1, 6)).toThrow('Score must be between 1 and 5');
  });
});
