/**
 * KNN Configuration - Modelo entrenado en Python
 * Configuración exportada del modelo KNN entrenado con dataset de PetFinder
 */

import knnConfigData from './knn_petfinder_config.json';

export interface KnnConfig {
  feature_names: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  n_neighbors: number;
  weights: string;
  metric: string;
}

// Exportar la configuración del modelo entrenado
export const knnConfig: KnnConfig = knnConfigData as KnnConfig;

// Validar que la configuración esté completa
if (!knnConfig.feature_names || knnConfig.feature_names.length !== 9) {
  throw new Error('KNN Config: feature_names debe tener 9 elementos');
}

if (!knnConfig.scaler_mean || knnConfig.scaler_mean.length !== 9) {
  throw new Error('KNN Config: scaler_mean debe tener 9 elementos');
}

if (!knnConfig.scaler_scale || knnConfig.scaler_scale.length !== 9) {
  throw new Error('KNN Config: scaler_scale debe tener 9 elementos');
}

console.log(`✓ KNN Config cargado: ${knnConfig.n_neighbors} vecinos, métrica ${knnConfig.metric}`);
