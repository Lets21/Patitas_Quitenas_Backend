"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalRecord = void 0;
// backend/src/models/ClinicalRecord.ts
const mongoose_1 = __importStar(require("mongoose"));
const VaccinationSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    nextDue: { type: Date },
}, { _id: false });
const DewormingSchema = new mongoose_1.Schema({
    type: { type: String, required: true },
    date: { type: Date, required: true },
    nextDue: { type: Date },
}, { _id: false });
const ClinicalRecordSchema = new mongoose_1.Schema({
    animalId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Animal", required: true, index: true },
    vaccinations: { type: [VaccinationSchema], default: [] },
    sterilized: { type: Boolean, default: false },
    dewormings: { type: [DewormingSchema], default: [] },
    diagnoses: { type: [String], default: [] },
    treatments: { type: [String], default: [] },
    vetNotes: { type: String, default: "" },
    clinicUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    approved: { type: Boolean, default: false },
}, { timestamps: true });
exports.ClinicalRecord = mongoose_1.default.models.ClinicalRecord ||
    mongoose_1.default.model("ClinicalRecord", ClinicalRecordSchema);
exports.default = exports.ClinicalRecord;
