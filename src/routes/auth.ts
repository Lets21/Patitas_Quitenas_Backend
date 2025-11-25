import { Router } from "express";
import { User } from "../models/User";
import { signJwt } from "../utils/jwt";
import bcrypt from "bcryptjs";
import { emailService } from "../services/emailService";

const router = Router();

// Validaciones
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "La contraseña debe contener al menos una letra mayúscula" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "La contraseña debe contener al menos una letra minúscula" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "La contraseña debe contener al menos un número" };
  }
  return { valid: true };
};

const validatePhone = (phone: string): boolean => {
  // Formato internacional: +[código país] [número]
  const phoneRegex = /^\+\d{1,4}\s?\d{6,14}$/;
  return phoneRegex.test(phone);
};

const validateName = (name: string): boolean => {
  if (!name || name.length < 2 || name.length > 50) return false;
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return nameRegex.test(name);
};

// Registro
router.post("/register", async (req, res) => {
  try {
    const { email, password, role, profile, foundationName, clinicName } = req.body;

    // Validación de email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Validación de contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Validación de rol
    const validRoles = ["ADMIN", "ADOPTANTE", "FUNDACION", "CLINICA"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    // Validación de perfil
    if (!profile?.firstName || !validateName(profile.firstName)) {
      return res.status(400).json({ error: "Nombre inválido (2-50 caracteres, solo letras)" });
    }
    if (!profile?.lastName || !validateName(profile.lastName)) {
      return res.status(400).json({ error: "Apellido inválido (2-50 caracteres, solo letras)" });
    }

    // Validación de teléfono
    if (profile?.phone && !validatePhone(profile.phone)) {
      return res.status(400).json({ 
        error: "Teléfono inválido. Use formato internacional: +[código] [número]" 
      });
    }

    // Validación de dirección
    if (profile?.address && (profile.address.length < 10 || profile.address.length > 200)) {
      return res.status(400).json({ error: "Dirección inválida (10-200 caracteres)" });
    }

    // Verificar si el email ya existe
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: "Email ya registrado" });

    const user = new User({
      email: email.toLowerCase(),
      password,
      role,
      profile: {
        ...profile,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone?.trim(),
        address: profile.address?.trim(),
      },
      status: "ACTIVE",
      foundationName: role === "FUNDACION" ? foundationName : undefined,
      clinicName: role === "CLINICA" ? clinicName : undefined,
    });
    await user.save();

    // Enviar email de bienvenida (no bloqueante)
    emailService.sendWelcomeEmail({
      to: user.email,
      name: `${profile.firstName} ${profile.lastName}`,
    }).catch((err: unknown) => console.error("Error al enviar email de bienvenida:", err));

    // no devolver password
    const safeUser = await User.findById(user._id).lean();
    return res.json({ user: safeUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    // Validación de campos requeridos
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    // Validación de formato de email
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Validación de longitud mínima de contraseña
    if (password.length < 8) {
      return res.status(400).json({ error: "Contraseña inválida" });
    }

    // Buscar usuario (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    // Verificar estado del usuario
    if (user.status !== "ACTIVE" || !user.isActive) {
      return res.status(403).json({ error: "Cuenta suspendida o inactiva" });
    }

    // Verificar contraseña
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    // Generar token
    const token = signJwt({ sub: String(user._id), email: user.email, role: user.role });
    const safeUser = await User.findById(user._id).lean();
    
    res.json({ user: safeUser, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

export default router;
