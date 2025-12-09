/**
 * KNN Core Functions - Implementación del algoritmo KNN
 * Funciones de distancia, escalado y scoring basadas en el modelo entrenado
 */

import { knnConfig } from './knnConfig';

/**
 * Aplica StandardScaler: (x - mean) / scale
 * Normaliza features usando los parámetros del modelo entrenado
 */
export function standardScale(features: number[]): number[] {
  if (features.length !== knnConfig.scaler_mean.length) {
    throw new Error(
      `standardScale: Se esperaban ${knnConfig.scaler_mean.length} features, recibidos ${features.length}`
    );
  }

  return features.map((x, i) => {
    const mean = knnConfig.scaler_mean[i];
    const scale = knnConfig.scaler_scale[i];
    
    // Evitar división por cero
    if (scale === 0) {
      return 0;
    }
    
    return (x - mean) / scale;
  });
}

/**
 * Calcula distancia Manhattan entre dos vectores
 * Manhattan: sum(|a[i] - b[i]|)
 */
export function manhattanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `manhattanDistance: Los vectores deben tener la misma longitud (${a.length} vs ${b.length})`
    );
  }

  return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
}

/**
 * Calcula distancia Euclidiana entre dos vectores
 * Euclidean: sqrt(sum((a[i] - b[i])^2))
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `euclideanDistance: Los vectores deben tener la misma longitud (${a.length} vs ${b.length})`
    );
  }

  const sumSquares = a.reduce((sum, val, i) => {
    const diff = val - b[i];
    return sum + diff * diff;
  }, 0);

  return Math.sqrt(sumSquares);
}

/**
 * Calcula distancia según la métrica configurada en el modelo
 */
export function distance(a: number[], b: number[]): number {
  const metric = knnConfig.metric.toLowerCase();

  switch (metric) {
    case 'manhattan':
      return manhattanDistance(a, b);
    case 'euclidean':
      return euclideanDistance(a, b);
    default:
      // Por defecto, usar Manhattan
      console.warn(`Métrica desconocida: ${metric}, usando Manhattan`);
      return manhattanDistance(a, b);
  }
}

/**
 * Convierte distancia a score (0-100)
 * Menor distancia = Mayor score
 * Usa transformación exponencial suave para distribuir scores
 */
export function distanceToScore(dist: number): number {
  // Parámetros calibrados para distancias Manhattan típicas
  // Con 9 features normalizadas, distancias típicas están en rango [0, 30]
  
  const maxDistance = 30; // Distancia máxima esperada
  const normalizedDist = Math.min(dist, maxDistance) / maxDistance;
  
  // Función exponencial: score = 100 * e^(-k * dist_norm)
  // k = 3.0 para distribución natural de scores
  const k = 3.0;
  const score = 100 * Math.exp(-k * normalizedDist);
  
  // Redondear a 1 decimal
  return Math.round(score * 10) / 10;
}

/**
 * Calcula percentil de un valor en un array ordenado
 * Útil para entender dónde se encuentra un match en la distribución
 */
export function calculatePercentile(value: number, sortedArray: number[]): number {
  if (sortedArray.length === 0) return 0;
  
  const count = sortedArray.filter(v => v <= value).length;
  return (count / sortedArray.length) * 100;
}
