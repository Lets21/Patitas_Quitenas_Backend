import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import { Animal } from '../models/Animal';

describe('Animal Model', () => {
  it('debería crear un animal con nombre y atributos', () => {
    const mongoose = require('mongoose');
    const animal = new Animal({
      name: 'Firulais',
      attributes: {
        age: 3,
        size: 'MEDIUM',
        breed: 'Mestizo',
        gender: 'MALE',
        energy: 'HIGH',
        coexistence: { children: true, cats: false, dogs: true }
      },
      foundationId: new mongoose.Types.ObjectId()
    });
    expect(animal.name).toBe('Firulais');
    expect(animal.attributes.age).toBe(3);
    expect(animal.attributes.breed).toBe('Mestizo');
    expect(mongoose.Types.ObjectId.isValid(animal.foundationId)).toBe(true);
  });
});
