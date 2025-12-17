// src/routes/appointments.ts
import { Router, Request, Response, NextFunction } from "express";
import { Appointment } from "../models/Appointment";
import { Application } from "../models/Application";
import { Animal } from "../models/Animal";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { verifyJWT } from "../middleware/verifyJWT";
import mongoose from "mongoose";

const router = Router();

// POST /api/v1/appointments (USER only)
router.post(
  "/",
  verifyJWT,
  requireRole("ADOPTANTE"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser: any = (req as any).user || {};
      const adopterUserId = authUser.id || authUser._id || authUser.sub;

      const { applicationId, requestedDateTime, notes } = req.body || {};

      if (!applicationId) {
        return res.status(400).json({ error: "applicationId es requerido" });
      }
      if (!requestedDateTime) {
        return res.status(400).json({ error: "requestedDateTime es requerido" });
      }

      // Validar que la aplicación existe, pertenece al usuario y está APPROVED
      const application = await Application.findById(applicationId).lean();
      if (!application) {
        return res.status(404).json({ error: "Solicitud no encontrada" });
      }

      const applicationAdopterId = String(application.adopterId);
      if (applicationAdopterId !== String(adopterUserId)) {
        return res.status(403).json({ error: "No tienes permiso para esta solicitud" });
      }

      if (application.status !== "APPROVED") {
        return res.status(400).json({
          error: "Solo puedes agendar citas para solicitudes aprobadas",
        });
      }

      // Verificar que no existe una cita activa para esta aplicación
      const activeStatuses: any[] = ["REQUESTED", "ACCEPTED", "RESCHEDULE_PROPOSED", "RESCHEDULED"];
      const existingAppointment = await Appointment.findOne({
        applicationId: new mongoose.Types.ObjectId(applicationId),
        status: { $in: activeStatuses },
      }).lean();

      if (existingAppointment) {
        return res.status(400).json({
          error: "Ya existe una cita activa para esta solicitud",
          appointmentId: existingAppointment._id,
        });
      }

      // Obtener información del animal y fundación
      const animal = await Animal.findById(application.animalId).lean();
      if (!animal) {
        return res.status(404).json({ error: "Animal no encontrado" });
      }

      const foundationId = application.foundationId || (animal as any).foundationId;

      // Crear la cita
      const appointment = await Appointment.create({
        adopterUserId: new mongoose.Types.ObjectId(adopterUserId),
        animalId: new mongoose.Types.ObjectId(application.animalId),
        applicationId: new mongoose.Types.ObjectId(applicationId),
        foundationId: foundationId ? new mongoose.Types.ObjectId(foundationId) : undefined,
        clinicId: null, // Clínica UDLA (global)
        requestedDateTime: new Date(requestedDateTime),
        status: "REQUESTED",
        notes: notes || undefined,
      });

      // Obtener información del adoptante para la notificación
      const adopter = await User.findById(adopterUserId).lean();

      // Crear notificación para CLINICA (global, clinicId: null)
      Promise.resolve().then(async () => {
        try {
          await Notification.create({
            clinicId: null as any,
            type: "clinical",
            title: "Nueva cita solicitada",
            message: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""} ha solicitado una cita para ${(animal as any).name || ""}`,
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
            actionUrl: `/clinica/citas`,
            metadata: {
              animalName: (animal as any).name || "",
              userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`,
            },
          });
        } catch (err) {
          console.error("Error creando notificación para clínica:", err);
        }
      });

      res.status(201).json({ appointment });
    } catch (err) {
      console.error("Error en POST /appointments:", err);
      next(err);
    }
  }
);

// GET /api/v1/appointments/my (USER only)
router.get(
  "/my",
  verifyJWT,
  requireRole("ADOPTANTE"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser: any = (req as any).user || {};
      const adopterUserId = authUser.id || authUser._id || authUser.sub;

      const appointmentsRaw = await Appointment.find({
        adopterUserId: new mongoose.Types.ObjectId(adopterUserId),
      })
        .populate("animalId", "name photos attributes")
        .populate("applicationId", "status")
        .sort({ requestedDateTime: 1 })
        .lean();

      // Mapear los appointments para asegurar formato consistente
      const appointments = appointmentsRaw.map((apt: any) => {
        const animal = apt.animalId && typeof apt.animalId === 'object' 
          ? apt.animalId 
          : { name: "Sin nombre", photos: [], attributes: {} };
        
        return {
          ...apt,
          id: apt._id?.toString() || apt.id,
          _id: apt._id?.toString() || apt._id,
          animal: {
            name: animal.name || "Sin nombre",
            photos: animal.photos || [],
            attributes: animal.attributes || {},
          },
        };
      });

      res.json({ appointments });
    } catch (err) {
      console.error("Error en GET /appointments/my:", err);
      next(err);
    }
  }
);

// GET /api/v1/clinic/appointments (CLINICA only)
router.get(
  "/clinic",
  verifyJWT,
  requireRole("CLINICA"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Obtener todas las citas (clinicId null = Clínica UDLA global)
      const appointments = await Appointment.find({
        clinicId: null,
      })
        .populate("adopterUserId", "profile firstName lastName email")
        .populate("animalId", "name photos attributes")
        .populate("applicationId", "status")
        .sort({ requestedDateTime: 1 })
        .lean();

      // Formatear respuesta con información resumida
      const formattedAppointments = appointments.map((apt: any) => {
        const adopter = apt.adopterUserId || {};
        const animal = apt.animalId || {};
        const application = apt.applicationId || {};

        return {
          _id: apt._id,
          id: apt._id?.toString(),
          adopterUserId: apt.adopterUserId?._id || apt.adopterUserId,
          animalId: apt.animalId?._id || apt.animalId,
          applicationId: apt.applicationId?._id || apt.applicationId,
          requestedDateTime: apt.requestedDateTime,
          status: apt.status,
          notes: apt.notes,
          clinicResponseMessage: apt.clinicResponseMessage,
          proposedNewDateTime: apt.proposedNewDateTime,
          rescheduleHistory: apt.rescheduleHistory || [],
          adopterResponseToReschedule: apt.adopterResponseToReschedule,
          adopterProposedDateTime: apt.adopterProposedDateTime,
          adopterResponseMessage: apt.adopterResponseMessage,
          createdAt: apt.createdAt,
          updatedAt: apt.updatedAt,
          // Información resumida para UI
          adopter: {
            name: `${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""}`.trim() || adopter.email || "Sin nombre",
            email: adopter.email,
          },
          animal: {
            name: animal.name || "Sin nombre",
            photos: animal.photos || [],
            attributes: animal.attributes || {},
          },
          application: {
            status: application.status,
          },
        };
      });

      res.json({ appointments: formattedAppointments });
    } catch (err) {
      console.error("Error en GET /appointments/clinic:", err);
      next(err);
    }
  }
);

// PATCH /api/v1/clinic/appointments/:id/accept (CLINICA only)
router.patch(
  "/clinic/:id/accept",
  verifyJWT,
  requireRole("CLINICA"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      // Verificar que la cita pertenece a la clínica (clinicId null)
      if (appointment.clinicId !== null) {
        return res.status(403).json({ error: "No tienes permiso para esta cita" });
      }

      appointment.status = "ACCEPTED";
      await appointment.save();

      // Obtener información para notificación
      const populated = await Appointment.findById(id)
        .populate("adopterUserId", "profile firstName lastName email")
        .populate("animalId", "name")
        .lean();

      const adopter = (populated as any)?.adopterUserId || {};
      const animal = (populated as any)?.animalId || {};

      // Crear notificación para USER
      Promise.resolve().then(async () => {
        try {
          await Notification.create({
            userId: new mongoose.Types.ObjectId(appointment.adopterUserId),
            type: "clinical",
            title: "Cita aceptada",
            message: `Tu cita para ${animal.name || ""} ha sido aceptada. Fecha: ${new Date(appointment.requestedDateTime).toLocaleString("es-ES")}`,
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
            actionUrl: `/mis-solicitudes`,
            metadata: {
              animalName: animal.name || "",
              userName: `${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""}`,
            },
          });
        } catch (err) {
          console.error("Error creando notificación para usuario:", err);
        }
      });

      res.json({ appointment });
    } catch (err) {
      console.error("Error en PATCH /appointments/clinic/:id/accept:", err);
      next(err);
    }
  }
);

// PATCH /api/v1/clinic/appointments/:id/reject (CLINICA only)
router.patch(
  "/clinic/:id/reject",
  verifyJWT,
  requireRole("CLINICA"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { message } = req.body || {};

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.clinicId !== null) {
        return res.status(403).json({ error: "No tienes permiso para esta cita" });
      }

      appointment.status = "REJECTED";
      if (message) {
        appointment.clinicResponseMessage = message;
      }
      await appointment.save();

      // Obtener información para notificación
      const populated = await Appointment.findById(id)
        .populate("adopterUserId", "profile firstName lastName email")
        .populate("animalId", "name")
        .lean();

      const adopter = (populated as any)?.adopterUserId || {};
      const animal = (populated as any)?.animalId || {};

      // Crear notificación para USER
      Promise.resolve().then(async () => {
        try {
          await Notification.create({
            userId: new mongoose.Types.ObjectId(appointment.adopterUserId),
            type: "clinical",
            title: "Cita rechazada",
            message: `Tu cita para ${animal.name || ""} ha sido rechazada.${message ? ` Motivo: ${message}` : ""}`,
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
            actionUrl: `/mis-solicitudes`,
            metadata: {
              animalName: animal.name || "",
              userName: `${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""}`,
            },
          });
        } catch (err) {
          console.error("Error creando notificación para usuario:", err);
        }
      });

      res.json({ appointment });
    } catch (err) {
      console.error("Error en PATCH /appointments/clinic/:id/reject:", err);
      next(err);
    }
  }
);

// PATCH /api/v1/clinic/appointments/:id/reschedule (CLINICA only)
router.patch(
  "/clinic/:id/reschedule",
  verifyJWT,
  requireRole("CLINICA"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { proposedNewDateTime, message } = req.body || {};

      if (!proposedNewDateTime) {
        return res.status(400).json({ error: "proposedNewDateTime es requerido" });
      }

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.clinicId !== null) {
        return res.status(403).json({ error: "No tienes permiso para esta cita" });
      }

      // Si el usuario ya aceptó una propuesta anterior, cambiar a RESCHEDULED directamente
      // Si es la primera propuesta, usar RESCHEDULE_PROPOSED
      const newStatus =
        appointment.status === "RESCHEDULE_PROPOSED" ? "RESCHEDULED" : "RESCHEDULE_PROPOSED";

      appointment.status = newStatus;
      appointment.proposedNewDateTime = new Date(proposedNewDateTime);
      if (message) {
        appointment.clinicResponseMessage = message;
      }

      // Agregar al historial de reagendamientos
      if (!appointment.rescheduleHistory) {
        appointment.rescheduleHistory = [];
      }
      appointment.rescheduleHistory.push({
        proposedBy: "CLINIC",
        proposedDateTime: new Date(proposedNewDateTime),
        message: message || undefined,
        status: "PENDING",
        createdAt: new Date(),
      });

      // Resetear respuesta del adoptante si había una anterior
      appointment.adopterResponseToReschedule = undefined;
      appointment.adopterProposedDateTime = undefined;
      appointment.adopterResponseMessage = undefined;

      await appointment.save();

      // Obtener información para notificación
      const populated = await Appointment.findById(id)
        .populate("adopterUserId", "profile firstName lastName email")
        .populate("animalId", "name")
        .lean();

      const adopter = (populated as any)?.adopterUserId || {};
      const animal = (populated as any)?.animalId || {};

      // Crear notificación para USER
      Promise.resolve().then(async () => {
        try {
          await Notification.create({
            userId: new mongoose.Types.ObjectId(appointment.adopterUserId),
            type: "clinical",
            title: newStatus === "RESCHEDULED" ? "Cita reagendada" : "Propuesta de reagendamiento",
            message: `Tu cita para ${animal.name || ""} ha sido ${newStatus === "RESCHEDULED" ? "reagendada" : "propuesta para reagendarse"}. Nueva fecha: ${new Date(proposedNewDateTime).toLocaleString("es-ES")}${message ? `. ${message}` : ""}`,
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
            actionUrl: `/mis-solicitudes`,
            metadata: {
              animalName: animal.name || "",
              userName: `${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""}`,
            },
          });
        } catch (err) {
          console.error("Error creando notificación para usuario:", err);
        }
      });

      res.json({ appointment });
    } catch (err) {
      console.error("Error en PATCH /appointments/clinic/:id/reschedule:", err);
      next(err);
    }
  }
);

// PATCH /api/v1/clinic/appointments/:id/accept-adopter-proposal (CLINICA only)
// La clínica acepta una propuesta de fecha del adoptante
router.patch(
  "/clinic/:id/accept-adopter-proposal",
  verifyJWT,
  requireRole("CLINICA"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.clinicId !== null) {
        return res.status(403).json({ error: "No tienes permiso para esta cita" });
      }

      // Verificar que hay una propuesta del adoptante pendiente
      if (!appointment.adopterProposedDateTime) {
        return res.status(400).json({ error: "No hay una propuesta del adoptante para aceptar" });
      }

      // Actualizar el último item del historial si es del adoptante
      if (appointment.rescheduleHistory && appointment.rescheduleHistory.length > 0) {
        const lastItem = appointment.rescheduleHistory[appointment.rescheduleHistory.length - 1];
        if (lastItem.status === "PENDING" && lastItem.proposedBy === "ADOPTER") {
          lastItem.status = "ACCEPTED";
          lastItem.respondedAt = new Date();
        }
      }

      // Cambiar a RESCHEDULED y usar la fecha propuesta por el adoptante
      appointment.status = "RESCHEDULED";
      appointment.requestedDateTime = appointment.adopterProposedDateTime;
      appointment.proposedNewDateTime = undefined;
      appointment.adopterResponseToReschedule = undefined;
      appointment.adopterProposedDateTime = undefined;

      await appointment.save();

      // Obtener información para notificación
      const populated = await Appointment.findById(id)
        .populate("adopterUserId", "profile firstName lastName email")
        .populate("animalId", "name")
        .lean();

      const adopter = (populated as any)?.adopterUserId || {};
      const animal = (populated as any)?.animalId || {};

      // Crear notificación para USER
      Promise.resolve().then(async () => {
        try {
          await Notification.create({
            userId: new mongoose.Types.ObjectId(appointment.adopterUserId),
            type: "clinical",
            title: "Propuesta de fecha aceptada",
            message: `La clínica aceptó tu propuesta de fecha para ${animal.name || ""}. Nueva fecha: ${new Date(appointment.requestedDateTime).toLocaleString("es-ES")}`,
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
            actionUrl: `/mis-citas`,
            metadata: {
              animalName: animal.name || "",
              userName: `${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""}`,
            },
          });
        } catch (err) {
          console.error("Error creando notificación para usuario:", err);
        }
      });

      res.json({ appointment });
    } catch (err) {
      console.error("Error en PATCH /appointments/clinic/:id/accept-adopter-proposal:", err);
      next(err);
    }
  }
);

// PATCH /api/v1/appointments/:id/respond-reschedule (USER only)
// El adoptante responde a un reagendamiento propuesto por la clínica
router.patch(
  "/:id/respond-reschedule",
  verifyJWT,
  requireRole("ADOPTANTE"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser: any = (req as any).user || {};
      const adopterUserId = authUser.id || authUser._id || authUser.sub;
      const { id } = req.params;
      const { response, proposedNewDateTime, message } = req.body || {}; // response: "ACCEPTED" | "REJECTED" | "PROPOSED_NEW"

      // Validar que el ID existe
      if (!id || id === "undefined" || id === "null") {
        return res.status(400).json({ error: "ID de cita inválido" });
      }

      if (!response || !["ACCEPTED", "REJECTED", "PROPOSED_NEW"].includes(response)) {
        return res.status(400).json({ error: "response debe ser ACCEPTED, REJECTED o PROPOSED_NEW" });
      }

      if (response === "PROPOSED_NEW" && !proposedNewDateTime) {
        return res.status(400).json({ error: "proposedNewDateTime es requerido cuando response es PROPOSED_NEW" });
      }

      // Validar que el ID es un ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID de cita inválido" });
      }

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      // Verificar que la cita pertenece al usuario
      if (String(appointment.adopterUserId) !== String(adopterUserId)) {
        return res.status(403).json({ error: "No tienes permiso para esta cita" });
      }

      // Verificar que hay un reagendamiento pendiente
      if (appointment.status !== "RESCHEDULE_PROPOSED") {
        return res.status(400).json({ error: "No hay un reagendamiento pendiente para responder" });
      }

      // Actualizar el último item del historial
      if (appointment.rescheduleHistory && appointment.rescheduleHistory.length > 0) {
        const lastItem = appointment.rescheduleHistory[appointment.rescheduleHistory.length - 1];
        if (lastItem.status === "PENDING" && lastItem.proposedBy === "CLINIC") {
          lastItem.status = response === "ACCEPTED" ? "ACCEPTED" : response === "REJECTED" ? "REJECTED" : "REJECTED";
          lastItem.respondedAt = new Date();
        }
      }

      appointment.adopterResponseToReschedule = response as "ACCEPTED" | "REJECTED" | "PROPOSED_NEW";
      if (message) {
        appointment.adopterResponseMessage = message;
      }

      if (response === "ACCEPTED") {
        // Si acepta, cambiar a RESCHEDULED y usar la fecha propuesta
        appointment.status = "RESCHEDULED";
        if (appointment.proposedNewDateTime) {
          appointment.requestedDateTime = appointment.proposedNewDateTime;
        }
      } else if (response === "REJECTED") {
        // Si rechaza, mantener la fecha original y cambiar estado
        appointment.status = "REQUESTED"; // Volver a estado solicitado
      } else if (response === "PROPOSED_NEW") {
        // Si propone nueva fecha, agregar al historial y cambiar estado
        appointment.status = "RESCHEDULE_PROPOSED"; // Mantener en reagendamiento
        appointment.adopterProposedDateTime = new Date(proposedNewDateTime);
        
        // Agregar propuesta del adoptante al historial
        if (!appointment.rescheduleHistory) {
          appointment.rescheduleHistory = [];
        }
        appointment.rescheduleHistory.push({
          proposedBy: "ADOPTER",
          proposedDateTime: new Date(proposedNewDateTime),
          message: message || undefined,
          status: "PENDING",
          createdAt: new Date(),
        });
      }

      await appointment.save();

      // Obtener información para notificación a clínica
      const populated = await Appointment.findById(id)
        .populate("adopterUserId", "profile firstName lastName email")
        .populate("animalId", "name")
        .lean();

      const adopter = (populated as any)?.adopterUserId || {};
      const animal = (populated as any)?.animalId || {};

      // Crear notificación para CLINICA
      Promise.resolve().then(async () => {
        try {
          let notificationMessage = "";
          if (response === "ACCEPTED") {
            notificationMessage = `El adoptante ${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""} aceptó el reagendamiento para ${animal.name || ""}`;
          } else if (response === "REJECTED") {
            notificationMessage = `El adoptante ${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""} rechazó el reagendamiento para ${animal.name || ""}`;
          } else {
            notificationMessage = `El adoptante ${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""} propuso una nueva fecha para ${animal.name || ""}`;
          }

          await Notification.create({
            clinicId: null as any,
            type: "clinical",
            title: response === "ACCEPTED" ? "Reagendamiento aceptado" : response === "REJECTED" ? "Reagendamiento rechazado" : "Nueva propuesta de fecha",
            message: notificationMessage,
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
            actionUrl: `/clinica/citas`,
            metadata: {
              animalName: animal.name || "",
              userName: `${adopter.profile?.firstName || ""} ${adopter.profile?.lastName || ""}`,
            },
          });
        } catch (err) {
          console.error("Error creando notificación para clínica:", err);
        }
      });

      res.json({ appointment });
    } catch (err) {
      console.error("Error en PATCH /appointments/:id/respond-reschedule:", err);
      next(err);
    }
  }
);

export default router;

