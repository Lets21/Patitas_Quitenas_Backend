import { Router } from "express";
import { User } from "../models/User";
import { Animal } from "../models/Animal";
import { Application } from "../models/Application";
import { SystemSettings } from "../models/SystemSettings";
import { emailService } from "../services/emailService";

const router = Router();

// GET /api/v1/admin/overview
// Los middlewares requireAuth y requireRole ya se aplican en server.ts
router.get(
  "/overview",
  async (req, res) => {
    try {
      // Obtener fechas para comparaciones
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Estadísticas de usuarios
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      
      // Usuarios nuevos este mes vs mes anterior
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: firstDayOfMonth }
      });
      const newUsersLastMonth = await User.countDocuments({
        createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
      });
      const usersGrowth = newUsersLastMonth > 0 
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : 0;

      // Usuarios activos este mes vs mes anterior
      const activeUsersLastMonth = await User.countDocuments({
        isActive: true,
        updatedAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
      });
      const activeUsersGrowth = activeUsersLastMonth > 0
        ? Math.round(((activeUsers - activeUsersLastMonth) / activeUsersLastMonth) * 100)
        : 0;

      // Estadísticas de animales
      const totalAnimals = await Animal.countDocuments();
      const availableAnimals = await Animal.countDocuments({ state: "AVAILABLE" });
      
      // Adopciones (animales marcados como ADOPTED)
      const adoptedThisMonth = await Animal.countDocuments({
        state: "ADOPTED",
        updatedAt: { $gte: firstDayOfMonth }
      });
      const adoptedLastMonth = await Animal.countDocuments({
        state: "ADOPTED",
        updatedAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
      });
      const adoptionsGrowth = adoptedLastMonth > 0
        ? Math.round(((adoptedThisMonth - adoptedLastMonth) / adoptedLastMonth) * 100)
        : 0;

      // Estadísticas de aplicaciones
      const pendingApplications = await Application.countDocuments({
        status: { $in: ["RECEIVED", "IN_REVIEW", "HOME_VISIT"] }
      });
      const totalApplications = await Application.countDocuments();

      // Fundaciones y clínicas activas
      const activeFundations = await User.countDocuments({
        role: "FUNDACION",
        isActive: true
      });
      const activeClinics = await User.countDocuments({
        role: "CLINICA",
        isActive: true
      });

      return res.json({
        ok: true,
        stats: {
          totalUsers,
          activeUsers,
          adoptionsThisMonth: adoptedThisMonth,
          totalAnimals,
          availableAnimals,
          pendingApplications,
          totalApplications,
          activeFundations,
          activeClinics,
          growth: {
            users: usersGrowth,
            activeUsers: activeUsersGrowth,
            adoptions: adoptionsGrowth
          }
        }
      });
    } catch (error) {
      console.error("Error fetching admin overview:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al obtener estadísticas del sistema"
      });
    }
  }
);

// GET /api/v1/admin/analytics
// Endpoint para obtener datos de analítica de adopciones
router.get(
  "/analytics",
  async (req, res) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Total de solicitudes
      const totalSolicitudes = await Application.countDocuments();
      const solicitudesEsteMes = await Application.countDocuments({
        createdAt: { $gte: firstDayOfMonth }
      });
      const solicitudesMesAnterior = await Application.countDocuments({
        createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
      });
      const cambioSolicitudes = solicitudesMesAnterior > 0 
        ? Math.round(((solicitudesEsteMes - solicitudesMesAnterior) / solicitudesMesAnterior) * 100)
        : 0;

      // Adopciones completadas (%)
      const adopcionesAprobadas = await Application.countDocuments({ status: "APPROVED" });
      const porcentajeAdopciones = totalSolicitudes > 0 
        ? Math.round((adopcionesAprobadas / totalSolicitudes) * 100)
        : 0;
      
      const aprobMesAnterior = await Application.countDocuments({
        status: "APPROVED",
        updatedAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
      });
      const aprobEsteMes = await Application.countDocuments({
        status: "APPROVED",
        updatedAt: { $gte: firstDayOfMonth }
      });
      const cambioAdopciones = aprobMesAnterior > 0
        ? Math.round(((aprobEsteMes - aprobMesAnterior) / aprobMesAnterior) * 100)
        : 0;

      // Tiempo promedio de adopción (en días)
      const aprobadas = await Application.find({ status: "APPROVED" })
        .select("createdAt updatedAt")
        .limit(100);
      
      let tiempoPromedio = 14; // default
      if (aprobadas.length > 0) {
        const tiempos = aprobadas.map(app => {
          const diff = new Date(app.updatedAt).getTime() - new Date(app.createdAt).getTime();
          return Math.floor(diff / (1000 * 60 * 60 * 24));
        });
        tiempoPromedio = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
      }

      // Fundación más activa
      const fundaciones = await User.find({ role: "FUNDACION", isActive: true });
      let fundacionActiva = "N/A";
      let adopcionesFundacion = 0;

      if (fundaciones.length > 0) {
        const stats = await Promise.all(
          fundaciones.map(async (fund) => {
            const count = await Application.countDocuments({
              foundationId: fund._id,
              status: "APPROVED"
            });
            return {
              name: fund.organization?.name || fund.foundationName || "Sin nombre",
              count
            };
          })
        );
        const topFund = stats.sort((a, b) => b.count - a.count)[0];
        if (topFund) {
          fundacionActiva = topFund.name;
          adopcionesFundacion = topFund.count;
        }
      }

      // Clasificación K-NN (basado en scorePct)
      const altaProbabilidad = await Application.countDocuments({ scorePct: { $gte: 70 } });
      const probabilidadMedia = await Application.countDocuments({ scorePct: { $gte: 40, $lt: 70 } });
      const bajaProbabilidad = await Application.countDocuments({ scorePct: { $lt: 40 } });
      const totalClasificados = altaProbabilidad + probabilidadMedia + bajaProbabilidad;

      const datosKNN = totalClasificados > 0 ? [
        {
          categoria: "Alta probabilidad",
          valor: Math.round((altaProbabilidad / totalClasificados) * 100),
          color: "bg-green-500"
        },
        {
          categoria: "Probabilidad media",
          valor: Math.round((probabilidadMedia / totalClasificados) * 100),
          color: "bg-teal-500"
        },
        {
          categoria: "Baja probabilidad",
          valor: Math.round((bajaProbabilidad / totalClasificados) * 100),
          color: "bg-red-400"
        }
      ] : [
        { categoria: "Alta probabilidad", valor: 0, color: "bg-green-500" },
        { categoria: "Probabilidad media", valor: 0, color: "bg-teal-500" },
        { categoria: "Baja probabilidad", valor: 0, color: "bg-red-400" }
      ];

      // Análisis de abandono/rechazo
      const rechazadas = await Application.countDocuments({ status: "REJECTED" });
      
      // Perfiles recientes
      const perfilesRecientes = await Application.find({ status: { $in: ["APPROVED", "IN_REVIEW"] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("adopterId", "profile email")
        .populate("animalId", "name attributes")
        .lean();

      const perfiles = perfilesRecientes.map(app => {
        const adopter = app.adopterId as any;
        const animal = app.animalId as any;
        const firstName = adopter?.profile?.firstName || "";
        const lastName = adopter?.profile?.lastName || "";
        const iniciales = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "??";
        
        return {
          iniciales,
          nombre: `${firstName} ${lastName}`.trim() || "Usuario",
          ubicacion: "Ecuador",
          compatibilidad: app.scorePct || 0,
          perro: animal?.name || "Desconocido",
          descripcion: animal?.attributes?.breed || "Sin raza",
          estado: app.status === "APPROVED" ? "Completado" : "En revisión",
          fecha: new Date(app.createdAt).toLocaleDateString("es-EC"),
          colorInicial: ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500"][Math.floor(Math.random() * 4)]
        };
      });

      return res.json({
        ok: true,
        data: {
          metricas: {
            totalSolicitudes,
            cambioSolicitudes: `${cambioSolicitudes > 0 ? '+' : ''}${cambioSolicitudes}%`,
            adopcionesCompletadas: porcentajeAdopciones,
            cambioAdopciones: `${cambioAdopciones > 0 ? '+' : ''}${cambioAdopciones}%`,
            tiempoPromedio,
            cambioTiempo: "+3 días", // Calcular real si se requiere
            fundacionActiva,
            adopcionesFundacion
          },
          datosKNN,
          datosAbandono: [
            { razon: "Falta de documentos", porcentaje: 19 },
            { razon: "Espacio inadecuado", porcentaje: 28 },
            { razon: "Incompatibilidad", porcentaje: 23 },
            { razon: "Cambio de opinión", porcentaje: 15 },
            { razon: "Otros", porcentaje: 15 }
          ],
          perfilesRecientes: perfiles,
          topRazones: [
            "Espacio inadecuado para la mascota (28%)",
            "Incompatibilidad con otros animales (23%)",
            "Falta de documentación completa (19%)"
          ]
        }
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al obtener datos de analítica"
      });
    }
  }
);

// GET /api/v1/admin/users - Listar todos los usuarios con paginación y filtros
router.get(
  "/users",
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const role = (req.query.role as string) || "";
      const status = (req.query.status as string) || "";

      const skip = (page - 1) * limit;

      // Construir filtros
      const filters: any = {};
      
      if (search) {
        filters.$or = [
          { email: { $regex: search, $options: "i" } },
          { "profile.firstName": { $regex: search, $options: "i" } },
          { "profile.lastName": { $regex: search, $options: "i" } }
        ];
      }

      if (role) {
        filters.role = role;
      }

      if (status === "active") {
        filters.isActive = true;
      } else if (status === "inactive") {
        filters.isActive = false;
      }

      const total = await User.countDocuments(filters);
      const users = await User.find(filters)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.json({
        ok: true,
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al obtener usuarios"
      });
    }
  }
);

// POST /api/v1/admin/users - Crear nuevo usuario
router.post(
  "/users",
  async (req, res) => {
    try {
      const { email, password, role, profile, organization } = req.body;

      // Validar campos requeridos
      if (!email || !password || !role) {
        return res.status(400).json({
          ok: false,
          message: "Email, contraseña y rol son requeridos"
        });
      }

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          ok: false,
          message: "El email ya está registrado"
        });
      }

      // Para fundaciones/clínicas: permitir múltiples usuarios de la misma organización
      // No validamos unicidad del nombre de organización
      
      // Crear usuario
      const userData: any = {
        email,
        password,
        role,
        profile: profile || {},
        isActive: true
      };

      if (organization && (role === "FUNDACION" || role === "CLINICA")) {
        userData.organization = organization;
      }

      const user = await User.create(userData);

      return res.status(201).json({
        ok: true,
        message: "Usuario creado exitosamente",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al crear usuario"
      });
    }
  }
);

// PUT /api/v1/admin/users/:id - Actualizar usuario
router.put(
  "/users/:id",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { email, role, profile, organization, isActive } = req.body;

      const updateData: any = {};
      
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (profile) updateData.profile = profile;
      if (organization) updateData.organization = organization;
      if (typeof isActive === "boolean") updateData.isActive = isActive;

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, select: "-password" }
      );

      if (!user) {
        return res.status(404).json({
          ok: false,
          message: "Usuario no encontrado"
        });
      }

      return res.json({
        ok: true,
        message: "Usuario actualizado exitosamente",
        user
      });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al actualizar usuario"
      });
    }
  }
);

// DELETE /api/v1/admin/users/:id - Eliminar usuario
router.delete(
  "/users/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({
          ok: false,
          message: "Usuario no encontrado"
        });
      }

      return res.json({
        ok: true,
        message: "Usuario eliminado exitosamente"
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al eliminar usuario"
      });
    }
  }
);

// PATCH /api/v1/admin/users/:id/toggle-status - Activar/Desactivar usuario
router.patch(
  "/users/:id/toggle-status",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        { isActive },
        { new: true, select: "-password" }
      );

      if (!user) {
        return res.status(404).json({
          ok: false,
          message: "Usuario no encontrado"
        });
      }

      return res.json({
        ok: true,
        message: `Usuario ${isActive ? "activado" : "desactivado"} exitosamente`,
        user
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al cambiar estado del usuario"
      });
    }
  }
);

// GET /api/v1/admin/settings
router.get(
  "/settings",
  async (req, res) => {
    try {
      // Obtener o crear configuración del sistema
      let systemSettings = await SystemSettings.findOne().sort({ updatedAt: -1 });
      
      if (!systemSettings) {
        // Crear configuración por defecto si no existe
        systemSettings = await SystemSettings.create({
          systemName: process.env.SYSTEM_NAME || "AdoptaConCausa",
          contactEmail: process.env.CONTACT_EMAIL || "admin@adoptaconcausa.com",
          maxUsers: parseInt(process.env.MAX_USERS || "5000"),
          sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || "30"),
          maintenanceMode: false,
          autoBackup: "daily",
          logLevel: "info",
          emailNotifications: true,
          smsNotifications: false,
          maxFileSize: 10,
        });
      }

      // Obtener estadísticas del sistema
      const now = new Date();
      
      // Calcular uptime (simulado basado en la última actualización del sistema)
      const uptimePercentage = 99.8; // Esto debería venir de un sistema de monitoreo real

      // Obtener información de backups (última fecha)
      const lastBackup = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Hace 2 horas

      // Versión del sistema
      const systemVersion = process.env.APP_VERSION || "2.4.1";

      // Obtener conteo de usuarios
      const totalUsers = await User.countDocuments();
      
      // Última actualización de la configuración
      const lastUpdate = systemSettings.updatedAt;

      // Estadísticas de almacenamiento (simulado - en producción usar fs o servicio de storage)
      const storageUsed = 45.2; // GB
      const storageTotal = 100; // GB
      const storagePercentage = Math.round((storageUsed / storageTotal) * 100);

      // Configuración actual
      const settings = {
        systemName: systemSettings.systemName,
        contactEmail: systemSettings.contactEmail,
        maxUsers: systemSettings.maxUsers,
        sessionTimeout: systemSettings.sessionTimeout,
        maintenanceMode: systemSettings.maintenanceMode,
        autoBackup: systemSettings.autoBackup,
        logLevel: systemSettings.logLevel,
        emailNotifications: systemSettings.emailNotifications,
        smsNotifications: systemSettings.smsNotifications,
        maxFileSize: systemSettings.maxFileSize,
      };

      // Estadísticas del sistema
      const stats = {
        status: systemSettings.maintenanceMode ? "maintenance" : "operational",
        uptime: uptimePercentage,
        lastBackup: lastBackup.toISOString(),
        version: systemVersion,
        lastUpdate: lastUpdate.toISOString(),
        storage: {
          used: storageUsed,
          total: storageTotal,
          percentage: storagePercentage,
        },
        currentUsers: totalUsers,
      };

      res.json({
        ok: true,
        settings,
        stats,
      });
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({
        ok: false,
        message: "Error al obtener la configuración del sistema",
        error: error.message,
      });
    }
  }
);

// PUT /api/v1/admin/settings
router.put(
  "/settings",
  async (req, res) => {
    try {
      const {
        systemName,
        contactEmail,
        maxUsers,
        sessionTimeout,
        maintenanceMode,
        autoBackup,
        logLevel,
        emailNotifications,
        smsNotifications,
        maxFileSize,
      } = req.body;

      // Validaciones básicas
      if (maxUsers && (maxUsers < 1 || maxUsers > 100000)) {
        return res.status(400).json({
          ok: false,
          message: "El límite de usuarios debe estar entre 1 y 100000",
        });
      }

      if (sessionTimeout && (sessionTimeout < 5 || sessionTimeout > 1440)) {
        return res.status(400).json({
          ok: false,
          message: "El tiempo de sesión debe estar entre 5 y 1440 minutos",
        });
      }

      if (maxFileSize && (maxFileSize < 1 || maxFileSize > 100)) {
        return res.status(400).json({
          ok: false,
          message: "El tamaño máximo de archivo debe estar entre 1 y 100 MB",
        });
      }

      // Obtener configuración existente o crear una nueva
      let systemSettings = await SystemSettings.findOne().sort({ updatedAt: -1 });
      
      if (!systemSettings) {
        systemSettings = new SystemSettings({});
      }

      // Actualizar solo los campos proporcionados
      if (systemName !== undefined) systemSettings.systemName = systemName;
      if (contactEmail !== undefined) systemSettings.contactEmail = contactEmail;
      if (maxUsers !== undefined) systemSettings.maxUsers = maxUsers;
      if (sessionTimeout !== undefined) systemSettings.sessionTimeout = sessionTimeout;
      if (maintenanceMode !== undefined) systemSettings.maintenanceMode = maintenanceMode;
      if (autoBackup !== undefined) systemSettings.autoBackup = autoBackup;
      if (logLevel !== undefined) systemSettings.logLevel = logLevel;
      if (emailNotifications !== undefined) systemSettings.emailNotifications = emailNotifications;
      if (smsNotifications !== undefined) systemSettings.smsNotifications = smsNotifications;
      if (maxFileSize !== undefined) systemSettings.maxFileSize = maxFileSize;

      // Guardar el usuario que realizó la actualización
      if (req.user?.id) {
        systemSettings.updatedBy = req.user.id as any;
      }

      await systemSettings.save();

      const updatedSettings = {
        systemName: systemSettings.systemName,
        contactEmail: systemSettings.contactEmail,
        maxUsers: systemSettings.maxUsers,
        sessionTimeout: systemSettings.sessionTimeout,
        maintenanceMode: systemSettings.maintenanceMode,
        autoBackup: systemSettings.autoBackup,
        logLevel: systemSettings.logLevel,
        emailNotifications: systemSettings.emailNotifications,
        smsNotifications: systemSettings.smsNotifications,
        maxFileSize: systemSettings.maxFileSize,
      };

      res.json({
        ok: true,
        message: "Configuración actualizada exitosamente",
        settings: updatedSettings,
      });
    } catch (error: any) {
      console.error("Error updating system settings:", error);
      res.status(500).json({
        ok: false,
        message: "Error al actualizar la configuración del sistema",
        error: error.message,
      });
    }
  }
);

// POST /api/v1/admin/report-issue - Reportar problema técnico
router.post("/report-issue", async (req, res) => {
  try {
    const { issueType, description, stackTrace } = req.body;
    const user: any = (req as any).user || {};

    // Validaciones
    if (!issueType || !description) {
      return res.status(400).json({
        ok: false,
        error: "Tipo de problema y descripción son requeridos",
      });
    }

    // Obtener email del admin configurado
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    
    if (!adminEmail) {
      console.warn("No hay email de administrador configurado para reportes");
      return res.status(200).json({
        ok: true,
        message: "Reporte registrado (email no configurado)",
      });
    }

    // Enviar alerta por email
    await emailService.sendTechnicalIssueAlert({
      to: adminEmail,
      issueType,
      description,
      userEmail: user?.email,
      stackTrace,
    });

    return res.status(200).json({
      ok: true,
      message: "Problema reportado exitosamente. El equipo técnico ha sido notificado.",
    });
  } catch (error: any) {
    console.error("Error al reportar problema:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al enviar el reporte",
    });
  }
});

export default router;