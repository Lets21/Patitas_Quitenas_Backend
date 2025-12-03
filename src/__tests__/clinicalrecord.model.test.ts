import { describe, it, expect } from '@jest/globals';
import { ClinicalRecord } from '../models/ClinicalRecord';
import mongoose from 'mongoose';

describe('ClinicalRecord Model', () => {
  it('debería crear un registro clínico con animalId y clinicUserId', () => {
    const record = new ClinicalRecord({
      animalId: new mongoose.Types.ObjectId(),
      clinicUserId: new mongoose.Types.ObjectId()
    });
    expect(mongoose.Types.ObjectId.isValid(record.animalId)).toBe(true);
    expect(mongoose.Types.ObjectId.isValid(record.clinicUserId)).toBe(true);
  });
});
