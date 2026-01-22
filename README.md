# 🐾 Huellitas Quiteñas – Backend API

Backend de la WebApp **Patitas Quiteñas**, un sistema inteligente orientado a la **gestión, evaluación y recomendación responsable de adopciones de animales**, desarrollado como **proyecto de tesis universitaria**.

Este backend constituye la **capa central de negocio**, encargada de la seguridad, persistencia de datos, control de roles, lógica de adopción y orquestación de sistemas inteligentes basados en **Sistemas de Recomendación**, **Modelos de Decisión Multicriterio** y **Machine Learning supervisado**.

---

## 📌 Descripción General

El backend de **Patitas Quiteñas** está diseñado para soportar un ecosistema **multi-actor**, compuesto por:

* Adoptantes
* Fundaciones de rescate animal
* Clínicas veterinarias
* Administradores del sistema

La API gestiona de forma **segura, trazable y explicable** todo el ciclo de adopción:

* Registro y autenticación de usuarios
* Publicación y gestión de animales
* Solicitudes de adopción
* Evaluación objetiva de adoptantes
* Recomendación personalizada de animales
* Predicción de propensión de adopción
* Gestión clínica y citas veterinarias
* Notificaciones y comunicación entre actores

El sistema prioriza la **transparencia algorítmica**, la **trazabilidad de decisiones** y el **bienestar animal**, evitando la automatización ciega de procesos sensibles.

---

## 🧱 Arquitectura del Sistema

El backend sigue una **arquitectura REST modular por dominios**, separando responsabilidades para garantizar escalabilidad, mantenibilidad y claridad académica.

```
src/
│
├── server.ts              # Configuración del servidor y middlewares
├── index.ts               # Arranque y conexión a base de datos
│
├── models/                # Modelos Mongoose (MongoDB)
├── routes/                # Rutas REST por dominio funcional
├── controllers/           # Lógica de negocio compleja
├── services/              # Servicios transversales (scoring, matching, ML, email)
├── middleware/            # Autenticación, roles, rate limiting, uploads
│
├── knn/                   # Motor de recomendación (Content-Based Filtering)
├── ml/                    # Conversión y codificación de variables para ML
│
├── __tests__/             # Pruebas automatizadas con Jest
└── utils/                 # Utilidades generales
```

---

## ⚙️ Stack Tecnológico

* **Runtime:** Node.js 20
* **Lenguaje:** TypeScript
* **Framework:** Express.js
* **Base de datos:** MongoDB + Mongoose
* **Autenticación:** JWT (JSON Web Tokens)
* **Validación:** Zod
* **Seguridad:** Helmet, CORS, Rate Limiting
* **Uploads:** Multer + Cloudinary
* **Correo:** Servicio SMTP configurable
* **Testing:** Jest
* **Machine Learning:** Microservicio externo (scikit-learn)

---

## 🔐 Seguridad y Control de Acceso

El backend implementa medidas de seguridad alineadas con buenas prácticas profesionales:

* **Helmet:** cabeceras HTTP de seguridad (CSP, protección XSS, etc.)
* **CORS controlado:** lista blanca de orígenes + soporte para previews
* **Rate limiting:**

  * Global (protección contra abuso)
  * Específico en autenticación (prevención de fuerza bruta)
* **Autenticación JWT**
* **Control de roles:**

  * `ADMIN`
  * `FUNDACION`
  * `CLINICA`
  * `ADOPTANTE`

Cada endpoint crítico está protegido según el rol correspondiente.

---

## 🗂️ Modelos de Datos Principales

* **User:** usuarios del sistema y roles
* **Animal:** animales en adopción con atributos conductuales, físicos y clínicos
* **Application:** solicitudes de adopción con scoring y predicción
* **Appointment:** citas veterinarias
* **MedicalHistory / ClinicalRecord:** historial clínico
* **Notification:** sistema de notificaciones
* **ContactMessage:** mensajes de contacto
* **PasswordResetToken:** recuperación de contraseña
* **SystemSettings:** configuración global

Todos los modelos están diseñados para garantizar **consistencia, trazabilidad y auditabilidad**.

---

## 🤖 Algoritmos Inteligentes y Sistemas de Decisión

El backend incorpora **tres sistemas inteligentes diferenciados**, cada uno con un propósito específico.
No todos corresponden a Machine Learning supervisado, lo que se aclara explícitamente para evitar ambigüedades técnicas.

---

## 1️⃣ Sistema de Matching Inteligente de Animales

### (Recomendación Personalizada)

### 🧠 Algoritmo Utilizado

**Nombre técnico:**
**Content-Based Filtering using Vector Space Model (VSM)**

### 📐 Componentes Algorítmicos

* **Vector Space Model (VSM):**
  Adoptantes y animales se representan como vectores numéricos multidimensionales.
* **Métrica de similitud:**
  **Distancia Manhattan (L1 Distance)**
* **Ranking Algorithm:**
  Ordenación de animales por grado de compatibilidad.
* **Top-N Retrieval:**
  Retorno de los N animales más compatibles.

### 📍 Ubicación del Código

```
backend/src/knn/
backend/src/services/matching/
```

### 🧩 Clasificación

* Sistema de Recomendación
* Content-Based Filtering
* Recuperación de Información (Information Retrieval)
* No es Machine Learning

---

## 2️⃣ Sistema de Scoring de Solicitudes de Adopción

### (Evaluación de Adoptantes)

### 🎯 Objetivo

Evaluar la idoneidad de un adoptante mediante criterios objetivos y ponderados.

### 🧠 Algoritmo Utilizado

**Weighted Sum Model (WSM)**
**Tipo:** Algoritmo de Toma de Decisiones Multicriterio (MCDM)

### 📐 Funcionamiento

Cada criterio relevante recibe un peso y una puntuación normalizada.
La puntuación final se calcula mediante una suma ponderada:

[
Score = \sum (peso_i \times valor_i)
]

### 📍 Ubicación del Código

```
backend/src/services/scoring/scoreApplication.ts
```

### 🧩 Clasificación

* Algoritmo determinista
* Explicable y auditable
* No es Machine Learning

---

## 3️⃣ Clasificador de Propensión de Adopción

### (Machine Learning Supervisado)

### 🎯 Objetivo

Predecir la probabilidad de éxito de una solicitud de adopción.

### 🧠 Algoritmo Utilizado

**K-Nearest Neighbors (KNN) Classifier**

### 📐 Configuración

* Clasificación binaria
* Aprendizaje supervisado
* Biblioteca: `scikit-learn 1.6.1`
* Pipeline de preprocesamiento + clasificación

### 📍 Ubicación del Código

```
train.py
app.py
```

### 🔗 Integración

El backend consume el modelo como **microservicio independiente**, almacenando:

* Predicción
* Probabilidad
* Versión del modelo
* Explicación

Esto garantiza **trazabilidad y auditoría ética**.

---

## 🧠 Enfoque Híbrido del Sistema

| Componente | Tipo                    | Paradigma                    |
| ---------- | ----------------------- | ---------------------------- |
| Matching   | Content-Based Filtering | Recuperación de Información  |
| Scoring    | Weighted Sum Model      | Decisión Multicriterio       |
| Predicción | KNN Classifier          | Machine Learning Supervisado |

Este enfoque híbrido evita sesgos automatizados y refuerza la explicabilidad del sistema.

---

## 🌐 Endpoints Principales

### Públicos

* `GET /api/v1/health`
* `GET /api/v1/animals`
* `POST /api/v1/contact`

### Autenticación

* `/api/v1/auth/*`

### Autenticados

* `/users`
* `/applications`
* `/appointments`
* `/notifications`
* `/foundation`
* `/clinic`
* `/admin`
* `/matching`

---

## 🧪 Testing

El proyecto incluye pruebas automatizadas con **Jest**, cubriendo:

* Modelos
* Autenticación
* Middlewares
* Servicios críticos

---

## 🚀 Instalación y Ejecución

```bash
git clone https://github.com/tu-usuario/patitas-quitenas-backend.git
cd patitas-quitenas-backend
npm install
npm run dev
```

Configurar variables de entorno en `.env`.

---

## 🎓 Contexto Académico

Este backend forma parte del proyecto de tesis **Huellitas Quiteñas**, cuyo objetivo es demostrar cómo la ingeniería de software y los sistemas inteligentes pueden aplicarse de forma **ética, responsable y explicable** en procesos de adopción animal.

---

## 📄 Licencia

Proyecto desarrollado con fines académicos y sociales.

---
