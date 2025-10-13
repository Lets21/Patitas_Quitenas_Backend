"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    email: { type: String, unique: true, required: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "ADOPTANTE", "FUNDACION", "CLINICA"], required: true },
    profile: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: String,
        address: String,
    },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" },
    foundationName: String,
    clinicName: String,
}, { timestamps: true });
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    const salt = await bcryptjs_1.default.genSalt(10);
    // @ts-ignore
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = async function (candidate) {
    // @ts-ignore
    return bcryptjs_1.default.compare(candidate, this.password);
};
exports.User = (0, mongoose_1.model)("User", userSchema);
