/**
 * Matching Service - Implementación del algoritmo de emparejamiento basado en distancia
 * Basado en modelo entrenado con dataset de PetFinder
 */

import { knnConfig } from './knnConfig';
import { standardScale, distance, distanceToScore } from './knnCore';
import {
  buildAnimalFeatureVector,
  buildAdopterFeatureVector,
  explainFeatureVector,
  type Animal,
  type UserPreferences
} from './featureMapping';

export interface MatchResult {
  animalId: string;
  animalName: string;
  distance: number;
  score: number; // 0-100 (convertido de distancia)
  rank: number; // Posición en el ranking (1 = mejor match)
  isTopK: boolean; // Si está en los K mejores vecinos
  featureVector: number[]; // Vector de features del animal (para debugging)
  scaledVector: number[]; // Vector escalado (para debugging)
}

export interface KnnRecommendationResult {
  topMatches: MatchResult[]; // Top K matches
  allMatches: MatchResult[]; // Todos los matches ordenados
  adopterVector: number[]; // Vector del adoptante (para debugging)
  adopterScaledVector: number[]; // Vector escalado del adoptante
  k: number; // Número de vecinos considerados
  totalAnimals: number;
}

/**
 * Servicio principal de recomendación KNN
 */
export class KnnMatchingService {
  private k: number;

  constructor(k?: number) {
    // Usar k del modelo entrenado si no se especifica
    this.k = k ?? knnConfig.n_neighbors;
  }

  /**
   * Calcula recomendaciones KNN para un adoptante
   * @param adopterPrefs Preferencias del adoptante
   * @param animals Lista de animales disponibles
   * @returns Resultados de matching ordenados por distancia
   */
  public knnRecommend(
    adopterPrefs: UserPreferences,
    animals: Animal[]
  ): KnnRecommendationResult {
    if (animals.length === 0) {
      return {
        topMatches: [],
        allMatches: [],
        adopterVector: [],
        adopterScaledVector: [],
        k: this.k,
        totalAnimals: 0
      };
    }

    // 1. Construir vector del adoptante
    const adopterVector = buildAdopterFeatureVector(adopterPrefs);
    
    // 2. Escalar vector del adoptante
    const adopterScaledVector = standardScale(adopterVector);

    // 3. Calcular distancia con cada animal
    const matches: MatchResult[] = animals.map((animal: any) => {
      // Construir vector del animal
      const animalVector = buildAnimalFeatureVector(animal);
      
      // Escalar vector del animal
      const animalScaledVector = standardScale(animalVector);
      
      // Calcular distancia en espacio escalado
      const dist = distance(adopterScaledVector, animalScaledVector);
      
      // Convertir distancia a score (0-100)
      const score = distanceToScore(dist);

      return {
        animalId: animal.id || animal._id?.toString() || '',
        animalName: animal.name || 'Sin nombre',
        distance: dist,
        score: score,
        rank: 0, // Se asignará después de ordenar
        isTopK: false, // Se asignará después de ordenar
        featureVector: animalVector,
        scaledVector: animalScaledVector
      };
    });

    // 4. Ordenar por distancia (menor = mejor match)
    matches.sort((a, b) => a.distance - b.distance);

    // 5. Asignar ranks y marcar top K
    matches.forEach((match, index) => {
      match.rank = index + 1;
      match.isTopK = index < this.k;
    });

    // 6. Separar top K matches
    const topMatches = matches.slice(0, this.k);

    return {
      topMatches,
      allMatches: matches,
      adopterVector,
      adopterScaledVector,
      k: this.k,
      totalAnimals: animals.length
    };
  }

  /**
   * Calcula match para un animal específico
   */
  public calculateSingleMatch(
    adopterPrefs: UserPreferences,
    animal: Animal
  ): MatchResult {
    // Construir y escalar vectores
    const adopterVector = buildAdopterFeatureVector(adopterPrefs);
    const adopterScaledVector = standardScale(adopterVector);
    
    const animalVector = buildAnimalFeatureVector(animal);
    const animalScaledVector = standardScale(animalVector);
    
    // Calcular distancia
    const dist = distance(adopterScaledVector, animalScaledVector);
    const score = distanceToScore(dist);

    return {
      animalId: (animal as any).id || (animal as any)._id?.toString() || '',
      animalName: (animal as any).name || 'Sin nombre',
      distance: dist,
      score: score,
      rank: 1, // No hay contexto de otros animales
      isTopK: true,
      featureVector: animalVector,
      scaledVector: animalScaledVector
    };
  }

  /**
   * Genera explicación detallada del match
   */
  public explainMatch(
    adopterPrefs: UserPreferences,
    animal: Animal
  ): {
    match: MatchResult;
    adopterFeatures: Record<string, any>;
    animalFeatures: Record<string, any>;
    featureDifferences: Record<string, number>;
  } {
    const match = this.calculateSingleMatch(adopterPrefs, animal);
    
    const adopterVector = buildAdopterFeatureVector(adopterPrefs);
    const animalVector = buildAnimalFeatureVector(animal);
    
    const adopterFeatures = explainFeatureVector(adopterVector);
    const animalFeatures = explainFeatureVector(animalVector);
    
    // Calcular diferencias por feature (antes de escalar)
    const featureDifferences: Record<string, number> = {};
    const featureNames = knnConfig.feature_names;
    
    adopterVector.forEach((val, i) => {
      const diff = Math.abs(val - animalVector[i]);
      featureDifferences[featureNames[i]] = Math.round(diff * 100) / 100;
    });

    return {
      match,
      adopterFeatures,
      animalFeatures,
      featureDifferences
    };
  }

  /**
   * Obtiene estadísticas del matching
   */
  public getMatchingStats(
    adopterPrefs: UserPreferences,
    animals: Animal[]
  ): {
    totalAnimals: number;
    averageDistance: number;
    averageScore: number;
    minDistance: number;
    maxDistance: number;
    topKThreshold: number; // Distancia del K-ésimo vecino
  } {
    const result = this.knnRecommend(adopterPrefs, animals);
    
    if (result.allMatches.length === 0) {
      return {
        totalAnimals: 0,
        averageDistance: 0,
        averageScore: 0,
        minDistance: 0,
        maxDistance: 0,
        topKThreshold: 0
      };
    }

    const distances = result.allMatches.map(m => m.distance);
    const scores = result.allMatches.map(m => m.score);
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);
    
    // Distancia del K-ésimo vecino (threshold para top K)
    const topKThreshold = result.topMatches.length > 0
      ? result.topMatches[result.topMatches.length - 1].distance
      : 0;

    return {
      totalAnimals: result.totalAnimals,
      averageDistance: Math.round(avgDistance * 100) / 100,
      averageScore: Math.round(avgScore * 10) / 10,
      minDistance: Math.round(minDistance * 100) / 100,
      maxDistance: Math.round(maxDistance * 100) / 100,
      topKThreshold: Math.round(topKThreshold * 100) / 100
    };
  }

  /**
   * Ajusta el valor de K (número de vecinos)
   */
  public setK(k: number): void {
    if (k < 1) {
      throw new Error('K debe ser al menos 1');
    }
    this.k = k;
  }

  /**
   * Obtiene el valor actual de K
   */
  public getK(): number {
    return this.k;
  }
}

// Instancia singleton del servicio (usa K del modelo: 15)
export const knnMatchingService = new KnnMatchingService();
