/**
 * Servicio de Matching con KNN (K-Nearest Neighbors)
 * Calcula la compatibilidad entre adoptantes y caninos usando distancia euclidiana
 */

interface UserPreferences {
  preferredSize: "SMALL" | "MEDIUM" | "LARGE";
  preferredEnergy: "LOW" | "MEDIUM" | "HIGH";
  hasChildren: boolean;
  otherPets: "none" | "dog" | "cat" | "both";
  dwelling: string;
  experienceLevel?: "NONE" | "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  activityLevel?: "LOW" | "MEDIUM" | "HIGH";
  spaceSize?: "SMALL" | "MEDIUM" | "LARGE";
  timeAvailable?: "LOW" | "MEDIUM" | "HIGH";
  groomingCommitment?: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
}

interface AnimalAttributes {
  age: number;
  size: "SMALL" | "MEDIUM" | "LARGE";
  breed: string;
  gender: "MALE" | "FEMALE";
  energy: "LOW" | "MEDIUM" | "HIGH";
  coexistence: {
    children: boolean;
    cats: boolean;
    dogs: boolean;
  };
}

interface AnimalData {
  id: string;
  name: string;
  attributes: AnimalAttributes;
  personality?: {
    sociability?: number;
    energy?: number;
    training?: number;
    adaptability?: number;
  };
  compatibility?: {
    kids?: boolean;
    cats?: boolean;
    dogs?: boolean;
    apartment?: boolean;
  };
}

interface MatchResult {
  animalId: string;
  animalName: string;
  matchScore: number; // 0-100
  distance: number;
  matchReasons: string[];
  compatibilityFactors: {
    size: number;
    energy: number;
    coexistence: number;
    personality: number;
    lifestyle: number;
  };
}

/**
 * Servicio principal de matching con KNN
 */
export class KNNMatchingService {
  private k: number; // número de vecinos más cercanos a considerar

  constructor(k: number = 5) {
    this.k = k;
  }

  /**
   * Calcula las recomendaciones de caninos para un adoptante
   * @param userPreferences - Preferencias del usuario
   * @param animals - Lista de todos los animales disponibles
   * @returns Lista ordenada de matches con scores
   */
  public calculateMatches(
    userPreferences: UserPreferences,
    animals: AnimalData[]
  ): MatchResult[] {
    // Calcular distancia y score para cada animal
    const matches = animals.map((animal) => {
      const distance = this.calculateDistance(userPreferences, animal);
      const matchScore = this.distanceToScore(distance);
      const compatibilityFactors = this.calculateCompatibilityFactors(
        userPreferences,
        animal
      );
      const matchReasons = this.generateMatchReasons(
        userPreferences,
        animal,
        compatibilityFactors
      );

      return {
        animalId: animal.id,
        animalName: animal.name,
        matchScore,
        distance,
        matchReasons,
        compatibilityFactors,
      };
    });

    // Ordenar por score descendente (menor distancia = mejor match)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Obtiene los top K matches
   */
  public getTopMatches(
    userPreferences: UserPreferences,
    animals: AnimalData[],
    topK?: number
  ): MatchResult[] {
    const allMatches = this.calculateMatches(userPreferences, animals);
    return allMatches.slice(0, topK || this.k);
  }

  /**
   * Calcula la distancia euclidiana normalizada entre un usuario y un animal
   */
  private calculateDistance(
    userPrefs: UserPreferences,
    animal: AnimalData
  ): number {
    const features: number[] = [];
    const weights = {
      size: 3.5, // Mayor peso para tamaño - diferencias más marcadas
      energy: 4.0, // Peso muy alto para nivel de energía
      coexistence: 5.0, // Peso crítico para convivencia (dealbreaker)
      personality: 2.5, // Incrementado para considerar temperamento
      lifestyle: 3.0, // Incrementado para estilo de vida
    };

    // 1. Comparación de tamaño (normalizado 0-1)
    const sizeScore = this.compareSizes(userPrefs.preferredSize, animal.attributes.size);
    features.push(sizeScore * weights.size);

    // 2. Comparación de energía (normalizado 0-1)
    const energyScore = this.compareEnergy(userPrefs.preferredEnergy, animal.attributes.energy);
    features.push(energyScore * weights.energy);

    // 3. Compatibilidad de convivencia (muy importante)
    const coexistenceScore = this.calculateCoexistenceScore(userPrefs, animal);
    features.push(coexistenceScore * weights.coexistence);

    // 4. Compatibilidad de personalidad
    if (animal.personality) {
      const personalityScore = this.calculatePersonalityScore(userPrefs, animal);
      features.push(personalityScore * weights.personality);
    }

    // 5. Compatibilidad de estilo de vida
    const lifestyleScore = this.calculateLifestyleScore(userPrefs, animal);
    features.push(lifestyleScore * weights.lifestyle);

    // Calcular distancia euclidiana
    const sumOfSquares = features.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumOfSquares);
  }

  /**
   * Compara tamaños y retorna score de similitud (0 = iguales, 1 = muy diferentes)
   */
  private compareSizes(
    userSize: "SMALL" | "MEDIUM" | "LARGE",
    animalSize: "SMALL" | "MEDIUM" | "LARGE"
  ): number {
    const sizeMap = { SMALL: 0, MEDIUM: 1, LARGE: 2 };
    const diff = Math.abs(sizeMap[userSize] - sizeMap[animalSize]);
    return diff / 2; // Normalizar a 0-1
  }

  /**
   * Compara niveles de energía
   */
  private compareEnergy(
    userEnergy: "LOW" | "MEDIUM" | "HIGH",
    animalEnergy: "LOW" | "MEDIUM" | "HIGH"
  ): number {
    const energyMap = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    const diff = Math.abs(energyMap[userEnergy] - energyMap[animalEnergy]);
    return diff / 2; // Normalizar a 0-1
  }

  /**
   * Calcula score de convivencia (factores críticos)
   */
  private calculateCoexistenceScore(
    userPrefs: UserPreferences,
    animal: AnimalData
  ): number {
    let penalties = 0;
    let totalChecks = 0;

    // Verificar compatibilidad con niños
    if (userPrefs.hasChildren) {
      totalChecks++;
      const compatible =
        animal.attributes.coexistence.children ||
        animal.compatibility?.kids === true;
      if (!compatible) penalties += 1;
    }

    // Verificar compatibilidad con otras mascotas
    if (userPrefs.otherPets !== "none") {
      totalChecks++;
      const needsCats = userPrefs.otherPets === "cat" || userPrefs.otherPets === "both";
      const needsDogs = userPrefs.otherPets === "dog" || userPrefs.otherPets === "both";

      let compatible = true;
      if (needsCats && !animal.attributes.coexistence.cats && animal.compatibility?.cats !== true) {
        compatible = false;
      }
      if (needsDogs && !animal.attributes.coexistence.dogs && animal.compatibility?.dogs !== true) {
        compatible = false;
      }
      if (!compatible) penalties += 1;
    }

    // Verificar tipo de vivienda
    if (userPrefs.dwelling === "apartment") {
      totalChecks++;
      const aptFriendly =
        animal.attributes.size !== "LARGE" ||
        animal.attributes.energy !== "HIGH" ||
        animal.compatibility?.apartment === true;
      if (!aptFriendly) penalties += 0.5;
    }

    return totalChecks > 0 ? penalties / totalChecks : 0;
  }

  /**
   * Calcula compatibilidad de personalidad
   */
  private calculatePersonalityScore(
    userPrefs: UserPreferences,
    animal: AnimalData
  ): number {
    if (!animal.personality) return 0;

    let score = 0;
    let factors = 0;

    // Experiencia del adoptante vs. entrenabilidad del perro
    if (userPrefs.experienceLevel && animal.personality.training !== undefined) {
      factors++;
      const expMap = { NONE: 0, BEGINNER: 1, INTERMEDIATE: 2, EXPERT: 3 };
      const userExp = expMap[userPrefs.experienceLevel] || 1;
      const trainingNeed = 5 - (animal.personality.training || 3); // Invertir: menos training = más difícil
      
      const diff = Math.abs(userExp - trainingNeed / 1.5);
      score += diff / 3; // Normalizar
    }

    // Nivel de actividad vs. energía de la personalidad
    if (userPrefs.activityLevel && animal.personality.energy !== undefined) {
      factors++;
      const actMap = { LOW: 1, MEDIUM: 3, HIGH: 5 };
      const userAct = actMap[userPrefs.activityLevel] || 3;
      const diff = Math.abs(userAct - (animal.personality.energy || 3));
      score += diff / 5;
    }

    // Sociabilidad para familias/personas sociales
    if (userPrefs.hasChildren && animal.personality.sociability !== undefined) {
      factors++;
      // Para niños, preferir alta sociabilidad
      if (animal.personality.sociability < 3) {
        score += 0.4;
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calcula compatibilidad de estilo de vida
   */
  private calculateLifestyleScore(
    userPrefs: UserPreferences,
    animal: AnimalData
  ): number {
    let score = 0;
    let factors = 0;

    // Espacio disponible vs tamaño del animal
    if (userPrefs.spaceSize) {
      factors++;
      const spaceMap = { SMALL: 0, MEDIUM: 1, LARGE: 2 };
      const sizeMap = { SMALL: 0, MEDIUM: 1, LARGE: 2 };
      const spaceDiff = spaceMap[userPrefs.spaceSize] - sizeMap[animal.attributes.size];
      if (spaceDiff < 0) score += Math.abs(spaceDiff) * 0.5; // Penalizar si el espacio es insuficiente
    }

    // Tiempo disponible vs necesidades del animal
    if (userPrefs.timeAvailable) {
      factors++;
      const timeMap = { LOW: 1, MEDIUM: 3, HIGH: 5 };
      const energyMap = { LOW: 1, MEDIUM: 3, HIGH: 5 };
      const userTime = timeMap[userPrefs.timeAvailable];
      const animalNeed = energyMap[animal.attributes.energy];
      
      if (userTime < animalNeed) {
        score += (animalNeed - userTime) / 5;
      }
    }

    // Compromiso de grooming vs raza (simplificado)
    if (userPrefs.groomingCommitment) {
      factors++;
      const groomingMap = { LOW: 1, MEDIUM: 2, HIGH: 3 };
      // Razas que necesitan más grooming (simplificado - en producción usar una lista real)
      const highMaintenanceBreeds = [
        "Poodle",
        "Husky",
        "Golden Retriever",
        "Shih Tzu",
        "Yorkshire",
      ];
      const needsGrooming = highMaintenanceBreeds.some((breed) =>
        animal.attributes.breed.toLowerCase().includes(breed.toLowerCase())
      );
      
      if (needsGrooming && groomingMap[userPrefs.groomingCommitment] < 2) {
        score += 0.6;
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Convierte distancia a score de 0-100
   */
  private distanceToScore(distance: number): number {
    // Usando función exponencial con mayor sensibilidad para distribución amplia
    // Distancia 0 = 100%, distancia alta = 0%
    const maxDistance = 15; // Aumentado para mayor rango
    const normalizedDistance = Math.min(distance, maxDistance) / maxDistance;
    const score = 100 * Math.exp(-2.2 * normalizedDistance); // Reducido para más variedad
    return Math.round(score * 10) / 10; // Redondear a 1 decimal
  }

  /**
   * Genera razones legibles del match
   */
  private generateMatchReasons(
    userPrefs: UserPreferences,
    animal: AnimalData,
    factors: MatchResult["compatibilityFactors"]
  ): string[] {
    const reasons: string[] = [];

    // Razones por tamaño
    if (factors.size < 0.3) {
      reasons.push(
        `Tamaño ${animal.attributes.size.toLowerCase()} ideal para tus preferencias`
      );
    }

    // Razones por energía
    if (factors.energy < 0.3) {
      const energyLabels = { LOW: "tranquilo", MEDIUM: "moderado", HIGH: "activo" };
      reasons.push(
        `Nivel de energía ${energyLabels[animal.attributes.energy]} compatible con tu estilo de vida`
      );
    }

    // Razones por convivencia
    if (factors.coexistence < 0.3) {
      if (userPrefs.hasChildren && animal.attributes.coexistence.children) {
        reasons.push("Excelente con niños");
      }
      if (
        userPrefs.otherPets !== "none" &&
        (animal.attributes.coexistence.cats || animal.attributes.coexistence.dogs)
      ) {
        reasons.push("Compatible con otras mascotas");
      }
    }

    // Razones por personalidad
    if (animal.personality && factors.personality < 0.4) {
      if (animal.personality.sociability && animal.personality.sociability >= 4) {
        reasons.push("Muy sociable y cariñoso");
      }
      if (animal.personality.training && animal.personality.training >= 4) {
        reasons.push("Fácil de entrenar");
      }
      if (animal.personality.adaptability && animal.personality.adaptability >= 4) {
        reasons.push("Se adapta fácilmente a nuevos entornos");
      }
    }

    // Razones por lifestyle
    if (factors.lifestyle < 0.4) {
      if (userPrefs.dwelling === "apartment" && animal.compatibility?.apartment) {
        reasons.push("Ideal para apartamento");
      }
    }

    // Si no hay razones específicas, dar una genérica
    if (reasons.length === 0) {
      reasons.push("Buena compatibilidad general con tu perfil");
    }

    return reasons;
  }

  /**
   * Calcula factores de compatibilidad individuales
   */
  private calculateCompatibilityFactors(
    userPrefs: UserPreferences,
    animal: AnimalData
  ): MatchResult["compatibilityFactors"] {
    return {
      size: this.compareSizes(userPrefs.preferredSize, animal.attributes.size),
      energy: this.compareEnergy(userPrefs.preferredEnergy, animal.attributes.energy),
      coexistence: this.calculateCoexistenceScore(userPrefs, animal),
      personality: this.calculatePersonalityScore(userPrefs, animal),
      lifestyle: this.calculateLifestyleScore(userPrefs, animal),
    };
  }
}

export const knnMatchingService = new KNNMatchingService(10);
