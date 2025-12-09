/**
 * Script de prueba del sistema KNN
 * Verifica que el modelo entrenado funciona correctamente
 */

import { knnMatchingService, explainFeatureVector } from '../src/knn';

console.log('🧪 Testing KNN System\n');
console.log('='.repeat(60));

// Preferencias de prueba: Persona activa, sin niños, principiante
const testPreferences = {
  preferredSize: 'MEDIUM',
  preferredEnergy: 'HIGH',
  hasChildren: false,
  otherPets: 'none',
  dwelling: 'house_with_yard',
  experienceLevel: 'BEGINNER',
  activityLevel: 'HIGH',
  spaceSize: 'LARGE',
  timeAvailable: 'HIGH',
  groomingCommitment: 'MEDIUM',
};

// Animales de prueba
const testAnimals = [
  {
    id: '1',
    name: 'Luna',
    attributes: { age: 3, size: 'MEDIUM', breed: 'Labrador' },
    ageMonths: 36,
    photos: ['photo1.jpg', 'photo2.jpg'],
    clinicalHistory: { sterilized: true, lastVaccination: '2024-01-15' },
  },
  {
    id: '2',
    name: 'Max',
    attributes: { age: 1, size: 'LARGE', breed: 'Husky' },
    ageMonths: 12,
    photos: ['photo1.jpg'],
    clinicalHistory: { sterilized: false },
  },
  {
    id: '3',
    name: 'Bella',
    attributes: { age: 7, size: 'SMALL', breed: 'Chihuahua' },
    ageMonths: 84,
    photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
    clinicalHistory: { sterilized: true, lastVaccination: '2024-02-10' },
  },
  {
    id: '4',
    name: 'Rocky',
    attributes: { age: 2, size: 'MEDIUM', breed: 'Golden Retriever' },
    ageMonths: 24,
    photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg', 'photo4.jpg'],
    clinicalHistory: { sterilized: true, lastVaccination: '2024-03-01' },
  },
];

console.log('\n📋 Preferencias del Adoptante:');
console.log(JSON.stringify(testPreferences, null, 2));

console.log('\n🐕 Animales Disponibles:');
testAnimals.forEach(animal => {
  console.log(`  - ${animal.name}: ${animal.attributes.size}, ${animal.attributes.age} años, ${animal.attributes.breed}`);
});

console.log('\n⚙️  Calculando matches con KNN...\n');
console.log('='.repeat(60));

const result = knnMatchingService.knnRecommend(testPreferences as any, testAnimals as any);

console.log('\n🎯 TOP K MATCHES (K = ' + result.k + '):\n');

result.topMatches.forEach((match, index) => {
  console.log(`${index + 1}. ${match.animalName}`);
  console.log(`   Distance: ${match.distance.toFixed(2)}`);
  console.log(`   Score: ${match.score.toFixed(1)}%`);
  console.log(`   Rank: #${match.rank}`);
  console.log(`   Top K: ${match.isTopK ? '✅' : '❌'}`);
  console.log('');
});

console.log('='.repeat(60));

// Obtener estadísticas
const stats = knnMatchingService.getMatchingStats(testPreferences as any, testAnimals as any);

console.log('\n📊 ESTADÍSTICAS:\n');
console.log(`   Total Animales: ${stats.totalAnimals}`);
console.log(`   Distancia Promedio: ${stats.averageDistance}`);
console.log(`   Score Promedio: ${stats.averageScore}%`);
console.log(`   Distancia Mínima: ${stats.minDistance}`);
console.log(`   Distancia Máxima: ${stats.maxDistance}`);
console.log(`   Threshold Top K: ${stats.topKThreshold}`);

console.log('\n='.repeat(60));

// Explicar el mejor match
console.log('\n🔍 EXPLICACIÓN DEL MEJOR MATCH:\n');

const explanation = knnMatchingService.explainMatch(
  testPreferences as any,
  testAnimals[0] as any // Luna
);

console.log(`Animal: ${explanation.match.animalName}`);
console.log(`Distance: ${explanation.match.distance.toFixed(2)}`);
console.log(`Score: ${explanation.match.score.toFixed(1)}%`);

console.log('\n📈 Features del Adoptante:');
console.log(JSON.stringify(explanation.adopterFeatures, null, 2));

console.log('\n🐕 Features del Animal:');
console.log(JSON.stringify(explanation.animalFeatures, null, 2));

console.log('\n📉 Diferencias (valor absoluto):');
console.log(JSON.stringify(explanation.featureDifferences, null, 2));

console.log('\n='.repeat(60));
console.log('\n✅ Test completado exitosamente!');
console.log('\n💡 Interpretación:');
console.log('   - Menor distancia = Mejor match');
console.log('   - Score 100% = Match perfecto (distancia 0)');
console.log('   - Top K incluye los K vecinos más cercanos');
console.log('   - Algoritmo: KNN con distancia Manhattan');
console.log('   - Features normalizadas con StandardScaler');
