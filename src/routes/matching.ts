import { Router } from "express";
import { Animal } from "../models/Animal";
import { User } from "../models/User";
import { verifyJWT } from "../middleware/verifyJWT";
import { knnMatchingService } from "../services/matching/knnMatchingService";

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

    // Transformar animales al formato esperado por el servicio
    const animalsData = animals.map((animal: any) => ({
      id: animal._id.toString(),
      name: animal.name,
      attributes: animal.attributes,
      personality: animal.personality,
      compatibility: animal.compatibility,
    }));

    // Calcular matches usando KNN
    const topK = parseInt(req.query.limit as string) || 10;
    const matches = knnMatchingService.getTopMatches(
      preferences as any,
      animalsData,
      topK
    );

    // Enriquecer con datos completos de los animales
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const animal = await Animal.findById(match.animalId).lean();
        return {
          ...match,
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

    // Calcular match
    const animalData = {
      id: animal._id.toString(),
      name: animal.name,
      attributes: animal.attributes,
      personality: animal.personality,
      compatibility: animal.compatibility,
    };

    const matches = knnMatchingService.calculateMatches(
      preferences as any,
      [animalData as any]
    );

    if (matches.length === 0) {
      return res.status(500).json({ error: "Error al calcular match" });
    }

    const match = matches[0];

    return res.json({
      match: {
        ...match,
        animal: {
          id: animal._id.toString(),
          name: animal.name,
          photos: animal.photos,
          attributes: animal.attributes,
          state: animal.state,
          clinicalSummary: animal.clinicalSummary,
          personality: animal.personality,
          compatibility: animal.compatibility,
        },
      },
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

    // Transformar y calcular matches
    const animalsData = animals.map((animal: any) => ({
      id: animal._id.toString(),
      name: animal.name,
      attributes: animal.attributes,
      personality: animal.personality,
      compatibility: animal.compatibility,
    }));

    const matches = knnMatchingService.calculateMatches(
      preferences as any,
      animalsData
    );

    // Clasificar por score
    const highMatches = matches.filter((m) => m.matchScore >= 75).length;
    const mediumMatches = matches.filter(
      (m) => m.matchScore >= 50 && m.matchScore < 75
    ).length;
    const lowMatches = matches.filter((m) => m.matchScore < 50).length;

    return res.json({
      hasPreferences: true,
      totalAnimals,
      highMatches,
      mediumMatches,
      lowMatches,
      averageScore:
        matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length,
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
