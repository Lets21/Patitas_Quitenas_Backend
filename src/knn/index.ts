/**
 * KNN Module - Exportaciones principales
 * Sistema de recomendación basado en K-Nearest Neighbors
 */

export { knnConfig, type KnnConfig } from './knnConfig';
export { 
  standardScale, 
  distance, 
  manhattanDistance,
  euclideanDistance,
  distanceToScore,
  calculatePercentile
} from './knnCore';
export {
  buildAnimalFeatureVector,
  buildAdopterFeatureVector,
  getFeatureNames,
  explainFeatureVector,
  type Animal,
  type UserPreferences
} from './featureMapping';
export {
  KnnMatchingService,
  knnMatchingService,
  type MatchResult,
  type KnnRecommendationResult
} from './knnService';
