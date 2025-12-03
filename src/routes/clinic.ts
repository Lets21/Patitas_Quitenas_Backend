import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";
import {
  getMedicalHistory,
  createOrUpdateMedicalHistory,
  getAllAnimals,
} from "../controllers/medicalHistory";

const router = Router();

// GET /api/v1/clinic/records
router.get(
  "/records",
  verifyJWT,
  requireRole("CLINICA"),
  async (req, res) => {
    // TODO: trae de Mongo las fichas clínicas de la clínica del usuario
    return res.json({ records: [], user: req.user });
  }
);

// GET /api/v1/clinic/animals
// Obtener lista de todos los animales para el dashboard
router.get("/animals", verifyJWT, requireRole("CLINICA"), getAllAnimals);

// GET /api/v1/clinic/animals/:animalId/medical-history
// Obtener historial médico de un animal
router.get(
  "/animals/:animalId/medical-history",
  verifyJWT,
  requireRole("CLINICA"),
  getMedicalHistory
);

// POST /api/v1/clinic/animals/:animalId/medical-history
// Crear o actualizar historial médico de un animal
router.post(
  "/animals/:animalId/medical-history",
  verifyJWT,
  requireRole("CLINICA"),
  createOrUpdateMedicalHistory
);

export default router;