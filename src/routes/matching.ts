import { Router } from "express";
import { Animal } from "../models/Animal";
import { User } from "../models/User";
import { verifyJWT } from "../middleware/verifyJWT";
import { knnMatchingService } from "../knn";

const router = Router();

/**
 * GET /api/matching/recommendations
 * Obtiene recomendaciones personalizadas de caninos basadas en KNN
 */
router.get("/recommendations", verifyJWT, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Obtener usuario con preferencias
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const preferences = user.profile?.preferences;
    if (!preferences || !preferences.completed) {
      return res.status(400).json({
        error: "Debes completar tu perfil de preferencias primero",
        needsOnboarding: true,
      });
    }

    // Obtener todos los animales disponibles
    const animals = await Animal.find({
      state: { $in: ["AVAILABLE", "RESERVED"] },
    }).lean();

    if (animals.length === 0) {
      return res.json({
        matches: [],
        message: "No hay animales disponibles en este momento",
      });
    }

    // Transformar animales al formato esperado por el servicio KNN
    const animalsData = animals.map((animal: any) => ({
      id: animal._id.toString(),
      name: animal.name,
      attributes: animal.attributes,
      ageMonths: animal.ageMonths,
      photos: animal.photos,
      clinicalHistory: animal.clinicalHistory,
      personality: animal.personality,
    }));

    // Calcular matches usando KNN real (modelo entrenado)
    const topK = parseInt(req.query.limit as string) || 15; // Usar K del modelo por defecto
    const knnResult = knnMatchingService.knnRecommend(
      preferences as any,
      animalsData
    );

    // Obtener solo los top K matches
    const matches = knnResult.topMatches;

    // Enriquecer con datos completos de los animales
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const animal = await Animal.findById(match.animalId).lean();
        return {
          animalId: match.animalId,
          animalName: match.animalName,
          distance: match.distance, // Distancia Manhattan en espacio escalado
          score: match.score, // Score 0-100 (menor distancia = mayor score)
          rank: match.rank, // Posición en el ranking
          isTopK: match.isTopK, // Si está en los K mejores
          animal: animal ? {
            id: animal._id.toString(),
            name: animal.name,
            photos: animal.photos,
            attributes: animal.attributes,
            state: animal.state,
            clinicalSummary: animal.clinicalSummary,
            personality: animal.personality,
            compatibility: animal.compatibility,
          } : null,
        };
      })
    );

    // Filtrar matches sin animal (por si acaso)
    const validMatches = enrichedMatches.filter((m) => m.animal !== null);

    return res.json({
      matches: validMatches,
      total: validMatches.length,
      k: knnResult.k, // Número de vecinos considerados
      totalAnimals: knnResult.totalAnimals, // Total de animales evaluados
      algorithm: "KNN", // Indicar que es KNN real
      metric: "manhattan", // Métrica de distancia usada
      preferences: {
        preferredSize: preferences.preferredSize,
        preferredEnergy: preferences.preferredEnergy,
        hasChildren: preferences.hasChildren,
        otherPets: preferences.otherPets,
      },
    });
  } catch (error: any) {
    console.error("Error en recommendations:", error);
    return res.status(500).json({
      error: "Error al calcular recomendaciones",
      details: error.message,
    });
  }
});

/**
 * POST /api/matching/calculate
 * Calcula el match entre un usuario y un animal específico
 */
router.post("/calculate", verifyJWT, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { animalId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (!animalId) {
      return res.status(400).json({ error: "animalId requerido" });
    }

    // Obtener usuario con preferencias
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const preferences = user.profile?.preferences;
    if (!preferences || !preferences.completed) {
      return res.status(400).json({
        error: "Debes completar tu perfil de preferencias primero",
        needsOnboarding: true,
      });
    }

    // Obtener animal
    const animal = await Animal.findById(animalId).lean();
    if (!animal) {
      return res.status(404).json({ error: "Animal no encontrado" });
    }

    // Calcular match usando KNN real
    const animalData = {
      id: animal._id.toString(),
      name: animal.name,
      attributes: animal.attributes,
      ageMonths: (animal as any).ageMonths,
      photos: (animal as any).photos,
      clinicalHistory: (animal as any).clinicalHistory,
      personality: animal.personality,
    };

    const match = knnMatchingService.calculateSingleMatch(
      preferences as any,
      animalData as any
    );

    return res.json({
      match: {
        ...match,
        animal: {
          id: animal._id.toString(),
          name: animal.name,
          photos: (animal as any).photos,
          attributes: animal.attributes,
          state: (animal as any).state,
          clinicalSummary: (animal as any).clinicalSummary,
          personality: animal.personality,
          compatibility: (animal as any).compatibility,
        },
      },
      algorithm: "KNN",
      metric: "manhattan",
    });
  } catch (error: any) {
    console.error("Error en calculate match:", error);
    return res.status(500).json({
      error: "Error al calcular match",
      details: error.message,
    });
  }
});

/**
 * GET /api/matching/explain/:animalId
 * Explica en detalle por qué un animal es (o no es) compatible
 * Útil para debugging y transparencia del algoritmo
 */
router.get("/explain/:animalId", verifyJWT, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { animalId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Obtener usuario con preferencias
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const preferences = user.profile?.preferences;
    if (!preferences || !preferences.completed) {
      return res.status(400).json({
        error: "Debes completar tu perfil de preferencias primero",
        needsOnboarding: true,
      });
    }

    // Obtener animal
    const animal = await Animal.findById(animalId).lean();
    if (!animal) {
      return res.status(404).json({ error: "Animal no encontrado" });
    }

    // Generar explicación detallada
    const animalData = {
      id: animal._id.toString(),
      name: animal.name,
      attributes: animal.attributes,
      ageMonths: (animal as any).ageMonths,
      photos: (animal as any).photos,
      clinicalHistory: (animal as any).clinicalHistory,
      personality: animal.personality,
    };

    const explanation = knnMatchingService.explainMatch(
      preferences as any,
      animalData as any
    );

    return res.json({
      explanation,
      algorithm: "KNN",
      metric: "manhattan",
      k: knnMatchingService.getK(),
      note: "Features normalizadas con StandardScaler del modelo entrenado"
    });
  } catch (error: any) {
    console.error("Error en explain:", error);
    return res.status(500).json({
      error: "Error al explicar match",
      details: error.message,
    });
  }
});

/**
 * GET /api/matching/stats
 * Obtiene estadísticas sobre el matching del usuario
 */
router.get("/stats", verifyJWT, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const preferences = user.profile?.preferences;
    if (!preferences || !preferences.completed) {
      return res.json({
        hasPreferences: false,
        message: "Completa tu perfil para ver estadísticas",
      });
    }

    // Obtener todos los animales disponibles
    const totalAnimals = await Animal.countDocuments({
      state: { $in: ["AVAILABLE", "RESERVED"] },
    });

    const animals = await Animal.find({
      state: { $in: ["AVAILABLE", "RESERVED"] },
    }).lean();

    if (animals.length === 0) {
      return res.json({
        hasPreferences: true,
        totalAnimals: 0,
        highMatches: 0,
        mediumMatches: 0,
        lowMatches: 0,
      });
    }

    // Transformar y calcular matches usando KNN real
    const animalsData = animals.map((animal: any) => ({
      id: animal._id.toString(),
      name: animal.name,
      attributes: animal.attributes,
      ageMonths: animal.ageMonths,
      photos: animal.photos,
      clinicalHistory: animal.clinicalHistory,
      personality: animal.personality,
    }));

    const stats = knnMatchingService.getMatchingStats(
      preferences as any,
      animalsData
    );

    // Calcular matches para clasificar por score
    const knnResult = knnMatchingService.knnRecommend(
      preferences as any,
      animalsData
    );

    // Clasificar por score (ahora basado en distancia real)
    const highMatches = knnResult.allMatches.filter((m) => m.score >= 75).length;
    const mediumMatches = knnResult.allMatches.filter(
      (m) => m.score >= 50 && m.score < 75
    ).length;
    const lowMatches = knnResult.allMatches.filter((m) => m.score < 50).length;

    return res.json({
      hasPreferences: true,
      totalAnimals,
      highMatches,
      mediumMatches,
      lowMatches,
      averageScore: stats.averageScore,
      averageDistance: stats.averageDistance,
      minDistance: stats.minDistance,
      maxDistance: stats.maxDistance,
      topKThreshold: stats.topKThreshold,
      k: knnResult.k,
      algorithm: "KNN",
      metric: "manhattan",
    });
  } catch (error: any) {
    console.error("Error en stats:", error);
    return res.status(500).json({
      error: "Error al obtener estadísticas",
      details: error.message,
    });
  }
});

export default router;
