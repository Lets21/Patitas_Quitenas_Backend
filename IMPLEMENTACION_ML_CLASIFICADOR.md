# Sistema KNN Clasificador - Propensión de Adopción

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de KNN clasificador que predice la propensión de adopción (0 o 1) basándose en las características del perro cuando un adoptante envía una solicitud.

## 🔄 Cambios Implementados

### 1. Modelo Animal (`backend/src/models/Animal.ts`)
Se agregaron los siguientes campos para ML:

```typescript
// Códigos numéricos según dataset PetFinder
breed1Code: Number        // Breed1
breed2Code: Number        // Breed2 (para mezclas)
genderCode: Number        // 1=Male, 2=Female, 3=Mixed
color1Code: Number        // Color principal
color2Code: Number        // Color secundario  
color3Code: Number        // Color terciario
maturitySizeCode: Number  // 1=Small, 2=Medium, 3=Large, 4=ExtraLarge
furLengthCode: Number     // 1=Short, 2=Medium, 3=Long
vaccinatedCode: Number    // 1=Yes, 2=No, 3=NotSure
dewormedCode: Number      // 1=Yes, 2=No, 3=NotSure
sterilizedCode: Number    // 1=Yes, 2=No, 3=NotSure
healthCode: Number        // 1=Healthy, 2=MinorInjury, 3=SeriousInjury
adoptionFee: Number       // Fee en moneda local
photoCount: Number        // Cantidad de fotos
```

### 2. Modelo Application (`backend/src/models/Application.ts`)
Se agregaron campos para almacenar la predicción ML:

```typescript
propensityPred: Number    // 0 o 1 (no propenso / propenso a adoptar)
propensityProba: Number   // Probabilidad de 0 a 1
mlVersion: String         // "knn-v1" para tracking en tesis
```

### 3. Transformador de Datos (`backend/src/ml/dogToMlPayload.ts`)
- ✅ Ya estaba implementado correctamente
- Mapea los campos del modelo Animal a las features del dataset ML

### 4. Cliente ML (`backend/src/services/mlClient.ts`)
- ✅ Ya estaba implementado correctamente
- Función `predictAdoptionPropensity()` lista para usar

### 5. Ruta de Aplicaciones (`backend/src/routes/applications.ts`)
Se integró la predicción ML en el endpoint POST `/api/v1/applications`:

```typescript
// 1. Obtener el perro
const animal = await Animal.findById(animalId).lean();

// 2. Construir payload ML
const payload = dogToMlPayload(animal);

// 3. Llamar al microservicio ML
const result = await predictAdoptionPropensity(payload);
pred = result.pred;           // 0 o 1
proba = result.proba_adopta_1; // probabilidad

// 4. Guardar en la solicitud
await Application.create({
  // ... otros campos
  propensityPred: pred,
  propensityProba: proba,
  mlVersion: "knn-v1"
});
```

### 6. Script de Migración (`backend/tools/migrateAnimalsToML.ts`)
Script para actualizar animales existentes con valores por defecto para campos ML.

## 🚀 Pasos para Usar el Sistema

### 1. Migrar Animales Existentes

```bash
cd backend
npx ts-node tools/migrateAnimalsToML.ts
```

Este script:
- Conecta a la BD
- Actualiza todos los animales con valores por defecto para campos ML
- Mapea razas comunes a códigos
- Convierte tamaños y géneros a códigos numéricos

### 2. Levantar el Servicio ML

```bash
cd ml-service
uvicorn app:app --reload --host 0.0.0.0 --port 8001
```

### 3. Levantar el Backend

```bash
cd backend
npm run dev
```

### 4. Probar el Sistema

**Opción A: Desde el Frontend**
1. Iniciar sesión como adoptante
2. Buscar un perro en el catálogo
3. Enviar solicitud de adopción
4. La solicitud guardará automáticamente `propensityPred` y `propensityProba`

**Opción B: Desde Postman**
```bash
POST http://localhost:5000/api/v1/applications
Headers: Authorization: Bearer <token_adoptante>
Body: {
  "animalId": "...",
  "form": { ... }
}
```

**Respuesta esperada:**
```json
{
  "application": {
    "_id": "...",
    "animalId": "...",
    "adopterId": "...",
    "propensityPred": 1,        // 0 o 1
    "propensityProba": 0.85,    // probabilidad
    "mlVersion": "knn-v1",
    "scorePct": 75,
    // ... otros campos
  }
}
```

## 📊 Visualización para la Fundación

La fundación puede ver estos datos en:

1. **Lista de solicitudes**: Mostrar badge con propensión
2. **Detalle de solicitud**: Mostrar probabilidad como porcentaje
3. **Dashboard**: Estadísticas de propensión vs adopciones reales

### Ejemplo de Query para Fundación

```typescript
// En el endpoint GET /api/v1/foundation/applications
const applications = await Application.find({ foundationId })
  .populate('animalId')
  .populate('adopterId')
  .select('+propensityPred +propensityProba')
  .sort('-createdAt');
```

## 🔧 Configuración Requerida

### Variables de Entorno

En `backend/.env`:
```env
ML_SERVICE_URL=http://localhost:8001
```

## 📝 Notas Importantes

1. **Tolerancia a fallos**: Si el servicio ML falla, la solicitud se crea igual pero sin predicción
2. **Valores por defecto**: Los animales sin códigos ML usan valores seguros (0 o defaults)
3. **Compatibilidad**: Los campos antiguos del modelo Animal se mantienen intactos
4. **Versioning**: El campo `mlVersion` permite trackear qué modelo se usó (útil para tesis)

## 🎯 Próximos Pasos Sugeridos

1. **Actualizar los animales manualmente** con códigos precisos de razas/colores para mejor predicción
2. **Crear interfaz en el frontend** para que fundación vea la predicción
3. **Agregar métricas** para validar el modelo (comparar predicción vs adopción real)
4. **Dashboard de analytics** con estadísticas ML para la tesis

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Verificar que modelo ML funciona
cd ml-service
python quick_test.py
```

## ❓ Troubleshooting

### "ML predict error"
- Verificar que el servicio ML esté corriendo en puerto 8001
- Verificar que el modelo esté entrenado (`ml-service/model/`)
- Verificar variable `ML_SERVICE_URL` en `.env`

### "Faltan features"
- Verificar que todos los campos ML del Animal tengan valores
- Ejecutar script de migración si es necesario

### Predicción siempre 0 o siempre 1
- Revisar calidad de datos de entrenamiento
- Re-entrenar modelo: `cd ml-service && python train.py`
