"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Animal = void 0;
const mongoose_1 = require("mongoose");
const CoexistenceSchema = new mongoose_1.Schema({
    children: { type: Boolean, default: false },
    cats: { type: Boolean, default: false },
    dogs: { type: Boolean, default: false },
}, { _id: false });
const AttributesSchema = new mongoose_1.Schema({
    age: { type: Number, required: true }, // en años
    size: { type: String, enum: ["SMALL", "MEDIUM", "LARGE"], required: true },
    breed: { type: String, required: true },
    gender: { type: String, enum: ["MALE", "FEMALE"], required: true },
    energy: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
    coexistence: { type: CoexistenceSchema, required: true },
}, { _id: false });
const AnimalSchema = new mongoose_1.Schema({
    name: { type: String, required: true, index: true },
    photos: { type: [String], default: [] },
    attributes: { type: AttributesSchema, required: true },
    clinicalSummary: { type: String, default: "" },
    state: { type: String, enum: ["AVAILABLE", "RESERVED", "ADOPTED"], default: "AVAILABLE" },
    foundationId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
// Búsqueda por nombre/raza
AnimalSchema.index({ name: "text", "attributes.breed": "text" });
exports.Animal = (0, mongoose_1.model)("Animal", AnimalSchema);
//# sourceMappingURL=Animal.js.map