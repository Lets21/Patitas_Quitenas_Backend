# 🔄 Conversión de Campos ML para el Modelo KNN

## 📊 Resumen
El modelo KNN fue entrenado con **18 características numéricas** del dataset PetFinder. Nuestro sistema convierte automáticamente los valores legibles (strings) que se ingresan en el formulario a códigos numéricos que espera el modelo.

## 🎯 18 Características del Modelo

### Campos que el Usuario NO edita directamente:
1. **Type**: Siempre = 1 (Perro)
2. **Quantity**: Siempre = 1 (1 animal por solicitud)
3. **VideoAmt**: Siempre = 0 (no usamos videos)
4. **PhotoAmt**: Auto-calculado (cantidad de fotos subidas)
5. **Breed1**: 0 por defecto (código de raza principal - futuro)
6. **Breed2**: 0 por defecto (código de raza secundaria - futuro)

### Campos que el Usuario SÍ edita:

#### 1. **Age** (Edad en meses)
- **Formulario**: Campo numérico "Edad (meses)"
- **Ejemplo**: 12 meses = 1 año, 24 meses = 2 años
- **Enviado al ML**: Directamente el número ingresado
- ⚠️ **IMPORTANTE**: El dataset usa MESES, no años

#### 2. **Gender** (Género)
- **Formulario**: Select "Hembra" o "Macho"
- **Conversión**:
  - "MALE" → 1
  - "FEMALE" → 2
  - "Mixed" → 3
- **Archivo**: `mlCodes.ts` → `GENDER_CODES`

#### 3-5. **Color1, Color2, Color3** (Colores del perro)
- **Formulario**: 3 selectores de color
- **Conversión**:
  - "Black" (Negro) → 1
  - "Brown" (Marrón) → 2
  - "Golden" (Dorado) → 3
  - "Yellow" (Amarillo) → 4
  - "Cream" (Crema) → 5
  - "Gray" (Gris) → 6
  - "White" (Blanco) → 7
- **Archivo**: `mlCodes.ts` → `COLOR_CODES`
- **Default**: Color1 = Brown (2)

#### 6. **MaturitySize** (Tamaño adulto)
- **Formulario**: Select "Pequeño/Mediano/Grande/Extra Grande"
- **Conversión**:
  - "Small" → 1
  - "Medium" → 2
  - "Large" → 3
  - "Extra Large" → 4
- **Archivo**: `mlCodes.ts` → `MATURITY_SIZE_CODES`
- **Default**: Medium (2)

#### 7. **FurLength** (Largo de pelo)
- **Formulario**: Select "Corto/Mediano/Largo"
- **Conversión**:
  - "Short" → 1
  - "Medium" → 2
  - "Long" → 3
- **Archivo**: `mlCodes.ts` → `FUR_LENGTH_CODES`
- **Default**: Short (1)

#### 8. **Vaccinated** (Vacunado)
- **Formulario**: Select "Sí/No/No seguro"
- **Conversión**:
  - "Yes" → 1
  - "No" → 2
  - "Not Sure" → 3
- **Archivo**: `mlCodes.ts` → `YES_NO_CODES`
- **Default**: Not Sure (3)

#### 9. **Dewormed** (Desparasitado)
- **Formulario**: Select "Sí/No/No seguro"
- **Conversión**: Misma que Vaccinated
- **Default**: Not Sure (3)

#### 10. **Sterilized** (Esterilizado)
- **Formulario**: Select "Sí/No/No seguro"
- **Conversión**: Misma que Vaccinated
- **Default**: Not Sure (3)

#### 11. **Health** (Estado de salud)
- **Formulario**: Select "Saludable/Lesión menor/Lesión grave"
- **Conversión**:
  - "Healthy" → 1
  - "Minor Injury" → 2
  - "Serious Injury" → 3
- **Archivo**: `mlCodes.ts` → `HEALTH_CODES`
- **Default**: Healthy (1)

#### 12. **Fee** (Tarifa de adopción)
- **Valor**: SIEMPRE 0 (adopciones gratuitas)
- **Formulario**: OCULTO (no se muestra al usuario)
- **Enviado al ML**: 0

## 🔧 Flujo de Conversión

```
Usuario edita perro
    ↓
Frontend → { color1: "Brown", furLength: "Short", vaccinated: "Yes" }
    ↓
Backend (dogToMlPayload.ts) → Convierte a códigos
    ↓
ML Service → { Color1: 2, FurLength: 1, Vaccinated: 1 }
    ↓
Modelo KNN → Predice propensión (0 o 1)
```

## 📝 Ejemplo Completo

### Datos ingresados en formulario:
```json
{
  "name": "Luna",
  "ageMonths": 18,
  "gender": "FEMALE",
  "color1": "Brown",
  "color2": "White",
  "maturitySize": "Medium",
  "furLength": "Short",
  "vaccinated": "Yes",
  "dewormed": "Yes",
  "sterilized": "Yes",
  "health": "Healthy"
}
```

### Payload enviado al ML Service:
```json
{
  "Type": 1,
  "Age": 18,
  "Breed1": 0,
  "Breed2": 0,
  "Gender": 2,
  "Color1": 2,
  "Color2": 7,
  "Color3": 0,
  "MaturitySize": 2,
  "FurLength": 1,
  "Vaccinated": 1,
  "Dewormed": 1,
  "Sterilized": 1,
  "Health": 1,
  "Quantity": 1,
  "Fee": 0,
  "VideoAmt": 0,
  "PhotoAmt": 3
}
```

## ✅ Verificación de las 18 Características

| # | Campo | Valor Ejemplo | ¿Editable? | Conversión |
|---|-------|---------------|------------|------------|
| 1 | Type | 1 | ❌ | Fijo (Perro) |
| 2 | Age | 18 | ✅ | Directo (meses) |
| 3 | Breed1 | 0 | ❌ | Futuro |
| 4 | Breed2 | 0 | ❌ | Futuro |
| 5 | Gender | 2 | ✅ | FEMALE → 2 |
| 6 | Color1 | 2 | ✅ | Brown → 2 |
| 7 | Color2 | 7 | ✅ | White → 7 |
| 8 | Color3 | 0 | ✅ | null → 0 |
| 9 | MaturitySize | 2 | ✅ | Medium → 2 |
| 10 | FurLength | 1 | ✅ | Short → 1 |
| 11 | Vaccinated | 1 | ✅ | Yes → 1 |
| 12 | Dewormed | 1 | ✅ | Yes → 1 |
| 13 | Sterilized | 1 | ✅ | Yes → 1 |
| 14 | Health | 1 | ✅ | Healthy → 1 |
| 15 | Quantity | 1 | ❌ | Fijo |
| 16 | Fee | 0 | ❌ | Siempre 0 |
| 17 | VideoAmt | 0 | ❌ | Fijo |
| 18 | PhotoAmt | 3 | ❌ | Auto (fotos) |

**Total: 18 características** ✅ coinciden con el modelo entrenado
