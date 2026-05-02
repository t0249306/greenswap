// Calculate user rating based on new review score (1 to 5)
function calculateNewRating(currentRating, reviewsCount, newScore) {
  if (newScore < 1 || newScore > 5) {
    throw new Error('Score must be between 1 and 5');
  }
  const totalScore = currentRating * reviewsCount;
  const newTotalScore = totalScore + newScore;
  const newReviewsCount = reviewsCount + 1;
  return {
    newRating: newTotalScore / newReviewsCount,
    newReviewsCount
  };
}

module.exports = { calculateNewRating };
