import { Router } from "express";
import { ContactMessage } from "../models/ContactMessage";
import { emailService } from "../services/emailService";

const router = Router();

// POST /api/v1/contact - Enviar mensaje de contacto (público)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, destination, subject, message } = req.body;

    // Validaciones
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        error: "El nombre es requerido y debe tener al menos 2 caracteres",
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        ok: false,
        error: "Email inválido",
      });
    }

    if (!subject || subject.trim().length < 3) {
      return res.status(400).json({
        ok: false,
        error: "El asunto es requerido y debe tener al menos 3 caracteres",
      });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        ok: false,
        error: "El mensaje es requerido y debe tener al menos 10 caracteres",
      });
    }

    // Guardar mensaje en la base de datos
    const contactMessage = new ContactMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      destination: destination?.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: "NEW",
    });

    await contactMessage.save();

    // Enviar notificación por correo (no bloqueante)
    Promise.all([
      // 1. Notificación al admin/sistema
      emailService.sendContactNotification({
        name: contactMessage.name,
        email: contactMessage.email,
        phone: contactMessage.phone,
        destination: contactMessage.destination,
        subject: contactMessage.subject,
        message: contactMessage.message,
      }),
      
      // 2. Si hay un destino específico (fundación), notificar también
      (async () => {
        if (destination && destination.trim()) {
          try {
            const { User } = await import("../models/User");
            // Buscar fundación por nombre
            const foundation = await User.findOne({ 
              role: "FUNDACION",
              foundationName: { $regex: new RegExp(destination.trim(), "i") }
            }).lean();
            
            if (foundation) {
              await emailService.sendContactMessageToFoundation({
                to: foundation.email,
                foundationName: foundation.foundationName,
                senderName: contactMessage.name,
                senderEmail: contactMessage.email,
                senderPhone: contactMessage.phone,
                subject: contactMessage.subject,
                message: contactMessage.message,
              });
            }
          } catch (err) {
            console.error("Error notificando a fundación específica:", err);
          }
        }
      })(),
    ])
      .then(() => {
        console.log("✅ Notificaciones de contacto enviadas");
      })
      .catch((err) => {
        console.error("❌ Error al enviar notificaciones:", err);
      });

    return res.status(201).json({
      ok: true,
      message: "Mensaje enviado exitosamente. Te responderemos pronto.",
      data: {
        id: contactMessage._id,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error al procesar mensaje de contacto:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al enviar el mensaje. Por favor, inténtalo de nuevo.",
    });
  }
});

// GET /api/v1/contact - Obtener todos los mensajes (admin)
router.get("/", async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await ContactMessage.countDocuments(query);

    return res.json({
      ok: true,
      data: messages,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: total > Number(skip) + messages.length,
      },
    });
  } catch (error: any) {
    console.error("Error al obtener mensajes de contacto:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al obtener los mensajes",
    });
  }
});

// PATCH /api/v1/contact/:id/status - Actualizar estado del mensaje (admin)
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["NEW", "READ", "REPLIED", "ARCHIVED"].includes(status)) {
      return res.status(400).json({
        ok: false,
        error: "Estado inválido",
      });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        ok: false,
        error: "Mensaje no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: message,
    });
  } catch (error: any) {
    console.error("Error al actualizar estado del mensaje:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al actualizar el mensaje",
    });
  }
});

// DELETE /api/v1/contact/:id - Eliminar mensaje (admin)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({
        ok: false,
        error: "Mensaje no encontrado",
      });
    }

    return res.json({
      ok: true,
      message: "Mensaje eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error al eliminar mensaje:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al eliminar el mensaje",
    });
  }
});

export default router;
