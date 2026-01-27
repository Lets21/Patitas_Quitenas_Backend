# Mapeo de Códigos ML - Dataset PetFinder

Este documento explica los códigos numéricos que se usan en el modelo ML clasificador.

## 📊 Códigos por Categoría

### 1. Type (Tipo de Animal)
- `1` = Perro (Dog)
- `2` = Gato (Cat)

**En nuestra app**: Siempre es `1` porque solo trabajamos con perros.

---

### 2. Gender (Género)
- `1` = Macho (Male)
- `2` = Hembra (Female)
- `3` = Mixto/Grupo (Mixed)

**Mapeo en código**:
```typescript
MALE → 1
FEMALE → 2
```

---

### 3. MaturitySize (Tamaño en Madurez)
- `1` = Pequeño (Small) - 1-10 kg
- `2` = Mediano (Medium) - 10-25 kg
- `3` = Grande (Large) - 25-40 kg
- `4` = Extra Grande (Extra Large) - 40+ kg

**Mapeo en código**:
```typescript
SMALL → 1
MEDIUM → 2
LARGE → 3
```

---

### 4. FurLength (Largo del Pelaje)
- `1` = Corto (Short)
- `2` = Mediano (Medium)
- `3` = Largo (Long)

---

### 5. Vaccinated (Vacunado)
- `1` = Sí (Yes)
- `2` = No (No)
- `3` = No estoy seguro (Not Sure)

---

### 6. Dewormed (Desparasitado)
- `1` = Sí (Yes)
- `2` = No (No)
- `3` = No estoy seguro (Not Sure)

---

### 7. Sterilized (Esterilizado)
- `1` = Sí (Yes)
- `2` = No (No)
- `3` = No estoy seguro (Not Sure)

---

### 8. Health (Salud)
- `1` = Saludable (Healthy)
- `2` = Lesión menor (Minor Injury)
- `3` = Lesión seria (Serious Injury)

---

### 9. Breed Codes (Códigos de Raza)

Códigos más comunes del dataset PetFinder:

| Código | Raza (Español) | Raza (Inglés) |
|--------|----------------|---------------|
| 307 | Mestizo | Mixed Breed |
| 265 | Labrador Retriever | Labrador Retriever |
| 232 | Golden Retriever | Golden Retriever |
| 94 | Pastor Alemán | German Shepherd |
| 158 | Chihuahua | Chihuahua |
| 76 | Beagle | Beagle |
| 125 | Bulldog | Bulldog |
| 173 | Dachshund / Salchicha | Dachshund |
| 103 | Boxer | Boxer |
| 250 | Husky | Siberian Husky |
| 287 | Rottweiler | Rottweiler |
| 294 | Schnauzer | Schnauzer |
| 174 | Dálmata | Dalmatian |
| 295 | Shih Tzu | Shih Tzu |
| 273 | Pomerania | Pomeranian |
| 277 | Pug / Carlino | Pug |
| 162 | Cocker Spaniel | Cocker Spaniel |
| 218 | Maltés | Maltese |

**Nota**: Si no conoces el código exacto, usa `307` (Mestizo) como default.

---

### 10. Color Codes (Códigos de Color)

| Código | Color (Español) | Color (Inglés) |
|--------|-----------------|----------------|
| 1 | Negro | Black |
| 2 | Blanco | White |
| 3 | Marrón/Café | Brown |
| 4 | Dorado | Golden |
| 5 | Gris | Gray |
| 6 | Crema | Cream |
| 7 | Amarillo | Yellow |

**Uso**:
- `Color1`: Color principal del perro
- `Color2`: Color secundario (0 si no aplica)
- `Color3`: Color terciario (0 si no aplica)

---

### 11. Otros Campos

#### Age
- **Unidad**: Meses
- **Ejemplo**: 2 años = 24 meses

#### Quantity
- Siempre `1` (1 animal por solicitud)

#### Fee (Adoption Fee)
- Monto de la tarifa de adopción en moneda local
- Usar `0` si es adopción gratuita

#### PhotoAmt (Photo Amount)
- Cantidad de fotos del animal
- Se calcula automáticamente: `photos.length`

#### VideoAmt (Video Amount)
- Cantidad de videos
- En nuestra app: siempre `0` (no manejamos videos)

---

## 🔧 Ejemplo Completo

Para un perro con estas características:
- Nombre: "Max"
- Raza: Labrador mestizo
- Edad: 3 años
- Género: Macho
- Tamaño: Grande
- Color: Negro con manchas blancas
- Vacunado: Sí
- Esterilizado: Sí
- 5 fotos

**Códigos resultantes**:
```javascript
{
  Type: 1,                 // Perro
  Age: 36,                 // 3 años * 12 meses
  Breed1: 265,             // Labrador
  Breed2: 307,             // Mestizo (mezcla)
  Gender: 1,               // Macho
  Color1: 1,               // Negro
  Color2: 2,               // Blanco
  Color3: 0,               // No aplica
  MaturitySize: 3,         // Grande
  FurLength: 1,            // Corto
  Vaccinated: 1,           // Sí
  Dewormed: 3,             // No estoy seguro
  Sterilized: 1,           // Sí
  Health: 1,               // Saludable
  Quantity: 1,             // 1 perro
  Fee: 0,                  // Gratis
  VideoAmt: 0,             // Sin videos
  PhotoAmt: 5              // 5 fotos
}
```

---

## 📝 Notas para Configuración Manual

### En el Admin Panel de Fundación

Cuando crees o edites un animal, además de los campos normales, deberás configurar:

1. **Códigos de raza** (`breed1Code`, `breed2Code`)
   - Consulta la tabla de razas arriba
   - Usa 307 para mestizos
   - `breed2Code = 0` si no es mezcla

2. **Código de género** (`genderCode`)
   - Macho = 1, Hembra = 2

3. **Tamaño en madurez** (`maturitySizeCode`)
   - Pequeño = 1, Mediano = 2, Grande = 3

4. **Estado de salud** (`vaccinatedCode`, `dewormedCode`, `sterilizedCode`)
   - Sí = 1, No = 2, No estoy seguro = 3

5. **Códigos de color** (`color1Code`, `color2Code`, `color3Code`)
   - Consulta tabla de colores
   - Usa 0 para colores que no aplican

### Script de Migración

Si ya tienes animales en la BD, ejecuta:
```bash
npx ts-node tools/migrateAnimalsToML.ts
```

Este script intentará mapear automáticamente los valores existentes a códigos ML.

---

