import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import { Application } from '../models/Application';

describe('Application Model', () => {
  it('debería crear una solicitud con estado', () => {
    const mongoose = require('mongoose');
    const app = new Application({
      status: 'RECEIVED',
      animalId: new mongoose.Types.ObjectId(),
      adopterId: new mongoose.Types.ObjectId(),
      foundationId: new mongoose.Types.ObjectId()
    });
    expect(app.status).toBe('RECEIVED');
    expect(mongoose.Types.ObjectId.isValid(app.animalId)).toBe(true);
    expect(mongoose.Types.ObjectId.isValid(app.adopterId)).toBe(true);
    expect(mongoose.Types.ObjectId.isValid(app.foundationId)).toBe(true);
  });
});
