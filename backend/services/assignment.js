// Haversine distance formula to calculate distance between two coordinates in meters
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Ranks responders for a given emergency type and location.
 * Score weights:
 * - Distance: 40% (max 100, drops to 0 at 500m+)
 * - Skill Match: 30% (100 if matching, 0 if not)
 * - Availability: 20% (100 if AVAILABLE, 30 if BUSY, 0 if OFFLINE)
 * - Workload/Rating: 10% (50% based on workload, 50% based on rating)
 */
export function rankResponders(emergencyType, emergencyLat, emergencyLng, responders) {
  return responders
    .map((responder) => {
      // 1. Distance Score (0 to 100)
      const distance = getDistance(emergencyLat, emergencyLng, responder.latitude, responder.longitude);
      // Campus is roughly 500m. 0m = 100 points, >= 500m = 0 points
      const distanceScore = Math.max(0, 100 - distance / 5);

      // 2. Skill Match Score (0 or 100)
      const hasSkill = responder.skills.some(
        (s) => s.skill.toUpperCase() === emergencyType.toUpperCase()
      );
      const skillScore = hasSkill ? 100 : 0;

      // 3. Availability Score (0 to 100)
      let availabilityScore = 0;
      if (responder.availabilityStatus === 'AVAILABLE') {
        availabilityScore = 100;
      } else if (responder.availabilityStatus === 'BUSY') {
        availabilityScore = 30;
      }

      // 4. Workload Score (0 to 100)
      // 0 active jobs = 100, 1 active job = 50, 2+ active jobs = 0
      const workloadScore = Math.max(0, 100 - responder.currentWorkload * 50);

      // 5. Rating Score (0 to 100)
      // rating is 1.0 to 5.0. 5.0 = 100, 1.0 = 20
      const ratingScore = responder.rating * 20;

      // Combine workload and rating (each is 5% of overall score, i.e., 50% of this 10% bucket)
      const workloadRatingCombined = workloadScore * 0.5 + ratingScore * 0.5;

      // Calculate Total Weighted Score
      const totalScore =
        distanceScore * 0.4 +
        skillScore * 0.3 +
        availabilityScore * 0.2 +
        workloadRatingCombined * 0.1;

      // Calculate Estimated Response Time (ERT) in minutes
      // Assume speed of 2 m/s (fast walking / running on campus)
      // Plus a buffer of 30 seconds for reaction time
      const estimatedTimeSeconds = distance / 2 + 30;
      const ERT = Math.ceil(estimatedTimeSeconds / 60);

      return {
        ...responder,
        distance,
        distanceScore,
        skillScore,
        availabilityScore,
        workloadScore,
        ratingScore,
        ERT,
        score: Math.round(totalScore * 10) / 10, // Round to 1 decimal place
      };
    })
    .sort((a, b) => b.score - a.score);
}
