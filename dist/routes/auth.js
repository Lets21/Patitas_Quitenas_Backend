"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
// Registro
router.post("/register", async (req, res) => {
    try {
        const { email, password, role, profile, foundationName, clinicName } = req.body;
        if (!email || !password || !role || !profile?.firstName || !profile?.lastName) {
            return res.status(400).json({ error: "Datos incompletos" });
        }
        const exists = await User_1.User.findOne({ email });
        if (exists)
            return res.status(409).json({ error: "Email ya registrado" });
        const user = new User_1.User({
            email,
            password,
            role,
            profile,
            status: "ACTIVE",
            foundationName: role === "FUNDACION" ? foundationName : undefined,
            clinicName: role === "CLINICA" ? clinicName : undefined,
        });
        await user.save();
        // no devolver password
        const safeUser = await User_1.User.findById(user._id).lean();
        return res.json({ user: safeUser });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error de servidor" });
    }
});
// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ error: "Credenciales requeridas" });
    const user = await User_1.User.findOne({ email }).select("+password");
    if (!user)
        return res.status(401).json({ error: "Credenciales inválidas" });
    const ok = await bcryptjs_1.default.compare(password, user.password);
    if (!ok)
        return res.status(401).json({ error: "Credenciales inválidas" });
    const token = (0, jwt_1.signJwt)({ sub: String(user._id), email: user.email, role: user.role });
    const safeUser = await User_1.User.findById(user._id).lean();
    res.json({ user: safeUser, token });
});
exports.default = router;
