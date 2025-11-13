// src/services/scoring/scoreApplication.ts
import { Document } from "mongoose";

export interface AnimalDocument extends Document {
  attributes?: {
    age?: number; // en años
  };
  ageMonths?: number;
}

const WEIGHTS = {
  familyDecision: 0.15,
  monthlyBudget: 0.15,
  allowVisits: 0.10,
  acceptSterilization: 0.10,
  housing: 0.10,
  relationAnimals: 0.10,
  travelPlans: 0.10,
  behaviorResponse: 0.10,
  careCommitment: 0.10,
};

const RULES = {
  familyDecision: { agree: 1, accept: 0.7, indifferent: 0.4, disagree: 0 },
  monthlyBudget: { high: 1, medium: 0.7, low: 0.4 },
  allowVisits: { yes: 1, no: 0 },
  acceptSterilization: { yes: 1, no: 0 },
  housing: {
    "Casa urbana": 1,
    "Casa de campo": 1,
    "Departamento": 0.7,
    "Quinta": 1,
    "Hacienda": 1,
    "Otro": 0.5,
  },
  relationAnimals: { positive: 1, neutral: 0.6, negative: 0 },
  travelPlans: {
    withOwner: 1,
    withFamily: 0.9,
    withFriend: 0.8,
    paidCaretaker: 0.7,
    hotel: 0.6,
    other: 0.5,
  },
  behaviorResponse: {
    trainOrAccept: 1,
    seekHelp: 0.9,
    punish: 0.2,
    abandon: 0,
  },
  careCommitment: { fullCare: 1, mediumCare: 0.7, lowCare: 0.4 },
};

export function isPuppy(animal: AnimalDocument): boolean {
  // Si tiene ageMonths, usarlo directamente
  if (animal.ageMonths !== undefined) {
    return animal.ageMonths <= 12;
  }
  // Si solo tiene age en años, convertir: <= 1 año = cachorro
  const ageYears = animal.attributes?.age ?? 0;
  return ageYears <= 1;
}

export function scoreApplication(form: any, animal: AnimalDocument | any) {
  const weights: Record<string, number> = { ...WEIGHTS };

  // Si no es cachorro, eliminar el peso de esterilización
  if (!isPuppy(animal)) {
    delete weights.acceptSterilization;
  }

  let sum = 0;
  let max = 0;
  const detail: Record<string, { value: any; contribution: number }> = {};

  for (const key of Object.keys(weights)) {
    const weight = weights[key as keyof typeof weights];
    const rule = RULES[key as keyof typeof RULES];
    const val = form[key];

    if (rule && val !== undefined && val !== null) {
      const score = (rule[val as keyof typeof rule] ?? 0) * weight;
      sum += score;
      max += weight;
      detail[key] = {
        value: val,
        contribution: Math.round((score / weight) * 100),
      };
    } else {
      // Si falta el campo, no suma nada pero sí cuenta en el máximo
      max += weight;
      detail[key] = {
        value: val ?? "no especificado",
        contribution: 0,
      };
    }
  }

  const pct = max > 0 ? Math.round((sum / max) * 100) : 0;

  return {
    pct,
    eligible: pct >= 70,
    detail,
  };
}

